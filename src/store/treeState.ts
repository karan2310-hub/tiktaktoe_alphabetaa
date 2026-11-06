import { Board, NodeType, Step } from '../algorithm/types';

export type NodeVisualState = 'ACTIVE' | 'ON_STACK' | 'FINISHED' | 'PRUNED';

export interface VisualNode {
  id: string;
  parentId: string | null;
  board: Board;
  move: number | null;
  depth: number;
  nodeType: NodeType;
  state: NodeVisualState;
  isPrunedPlaceholder?: boolean;
  alpha?: number;
  beta?: number;
  value?: number;
  returnValue?: number;
  reason?: string;
  children: string[];
  history: Array<{ type: string; alpha?: number; beta?: number; value?: number; stepIndex: number }>;
}

export interface TreeSnapshot {
  stepIndex: number;
  nodes: Map<string, VisualNode>;
  stack: string[];
  visitedIds: string[];
  prunedIds: string[];
  activeNodeId: string | null;
  bestMove: number | null;
}

export class TreeStateCache {
  private steps: Step[] = [];
  private snapshots: TreeSnapshot[] = [];
  private snapshotInterval = 100;

  constructor(steps: Step[]) {
    this.steps = steps;
    this.buildSnapshots();
  }

  private cloneSnapshot(snap: TreeSnapshot, newIndex: number): TreeSnapshot {
    const newNodes = new Map<string, VisualNode>();
    for (const [id, node] of snap.nodes.entries()) {
      newNodes.set(id, {
        ...node,
        children: [...node.children],
        history: [...node.history],
      });
    }
    return {
      stepIndex: newIndex,
      nodes: newNodes,
      stack: [...snap.stack],
      visitedIds: [...snap.visitedIds],
      prunedIds: [...snap.prunedIds],
      activeNodeId: snap.activeNodeId,
      bestMove: snap.bestMove,
    };
  }

  private applyStep(state: TreeSnapshot, step: Step, stepIdx: number): void {
    // Reset previously active node to ON_STACK or FINISHED
    if (state.activeNodeId && state.nodes.has(state.activeNodeId)) {
      const prev = state.nodes.get(state.activeNodeId)!;
      if (prev.state === 'ACTIVE') {
        prev.state = 'ON_STACK';
      }
    }

    switch (step.type) {
      case 'ENTER_NODE': {
        const node: VisualNode = {
          id: step.nodeId,
          parentId: step.parentId,
          board: step.board,
          move: step.move,
          depth: step.depth,
          nodeType: step.nodeType,
          state: 'ACTIVE',
          alpha: step.alpha,
          beta: step.beta,
          value: undefined,
          children: [],
          history: [
            {
              type: 'ENTER',
              alpha: step.alpha,
              beta: step.beta,
              stepIndex: stepIdx,
            },
          ],
        };
        state.nodes.set(step.nodeId, node);
        if (step.parentId && state.nodes.has(step.parentId)) {
          const parent = state.nodes.get(step.parentId)!;
          if (!parent.children.includes(step.nodeId)) {
            parent.children.push(step.nodeId);
          }
        }
        state.stack.push(step.nodeId);
        state.activeNodeId = step.nodeId;
        break;
      }

      case 'EVALUATE_LEAF': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.value = step.value;
          node.reason = step.reason;
          node.state = 'ACTIVE';
          node.history.push({
            type: 'EVALUATE_LEAF',
            value: step.value,
            stepIndex: stepIdx,
          });
          state.activeNodeId = step.nodeId;
        }
        break;
      }

      case 'UPDATE_VALUE': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.value = step.value;
          node.state = 'ACTIVE';
          node.history.push({
            type: 'UPDATE_VALUE',
            value: step.value,
            stepIndex: stepIdx,
          });
          state.activeNodeId = step.nodeId;
        }
        break;
      }

      case 'UPDATE_ALPHA': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.alpha = step.newAlpha;
          node.state = 'ACTIVE';
          node.history.push({
            type: 'UPDATE_ALPHA',
            alpha: step.newAlpha,
            stepIndex: stepIdx,
          });
          state.activeNodeId = step.nodeId;
        }
        break;
      }

      case 'UPDATE_BETA': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.beta = step.newBeta;
          node.state = 'ACTIVE';
          node.history.push({
            type: 'UPDATE_BETA',
            beta: step.newBeta,
            stepIndex: stepIdx,
          });
          state.activeNodeId = step.nodeId;
        }
        break;
      }

      case 'PRUNE': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.state = 'ACTIVE';
          state.activeNodeId = step.nodeId;
          node.history.push({
            type: 'PRUNE',
            alpha: step.alpha,
            beta: step.beta,
            stepIndex: stepIdx,
          });
          // Add pruned placeholder child nodes
          for (const pc of step.prunedNodes) {
            if (!state.nodes.has(pc.nodeId)) {
              const prunedChild: VisualNode = {
                id: pc.nodeId,
                parentId: pc.parentId,
                board: pc.board,
                move: pc.move,
                depth: pc.depth,
                nodeType: pc.nodeType,
                state: 'PRUNED',
                isPrunedPlaceholder: true,
                alpha: step.alpha,
                beta: step.beta,
                children: [],
                history: [
                  {
                    type: 'PRUNED_CUTOFF',
                    alpha: step.alpha,
                    beta: step.beta,
                    stepIndex: stepIdx,
                  },
                ],
              };
              state.nodes.set(pc.nodeId, prunedChild);
              if (!node.children.includes(pc.nodeId)) {
                node.children.push(pc.nodeId);
              }
              if (!state.prunedIds.includes(pc.nodeId)) {
                state.prunedIds.push(pc.nodeId);
              }
            }
          }
        }
        break;
      }

      case 'EXIT_NODE': {
        const node = state.nodes.get(step.nodeId);
        if (node) {
          node.state = 'FINISHED';
          node.returnValue = step.returnValue;
          node.history.push({
            type: 'EXIT',
            value: step.returnValue,
            stepIndex: stepIdx,
          });
          if (!state.visitedIds.includes(step.nodeId)) {
            state.visitedIds.push(step.nodeId);
          }
        }
        // Pop from stack
        const idx = state.stack.lastIndexOf(step.nodeId);
        if (idx !== -1) {
          state.stack.splice(idx, 1);
        }
        state.activeNodeId = state.stack.length > 0 ? state.stack[state.stack.length - 1] : null;
        if (state.activeNodeId && state.nodes.has(state.activeNodeId)) {
          state.nodes.get(state.activeNodeId)!.state = 'ACTIVE';
        }
        break;
      }

      case 'CHOOSE_MOVE': {
        state.bestMove = step.move;
        state.activeNodeId = step.nodeId;
        break;
      }
    }
  }

  private buildSnapshots(): void {
    let current: TreeSnapshot = {
      stepIndex: -1,
      nodes: new Map(),
      stack: [],
      visitedIds: [],
      prunedIds: [],
      activeNodeId: null,
      bestMove: null,
    };

    this.snapshots.push(this.cloneSnapshot(current, -1));

    for (let i = 0; i < this.steps.length; i++) {
      this.applyStep(current, this.steps[i], i);
      current.stepIndex = i;

      if ((i + 1) % this.snapshotInterval === 0 || i === this.steps.length - 1) {
        this.snapshots.push(this.cloneSnapshot(current, i));
      }
    }
  }

  public getStateAtStep(stepIndex: number): TreeSnapshot {
    if (stepIndex < 0 || this.steps.length === 0) {
      return {
        stepIndex: -1,
        nodes: new Map(),
        stack: [],
        visitedIds: [],
        prunedIds: [],
        activeNodeId: null,
        bestMove: null,
      };
    }

    const clampedIndex = Math.min(stepIndex, this.steps.length - 1);

    // Find closest snapshot <= clampedIndex
    let bestSnap = this.snapshots[0];
    for (let i = 1; i < this.snapshots.length; i++) {
      if (this.snapshots[i].stepIndex <= clampedIndex) {
        bestSnap = this.snapshots[i];
      } else {
        break;
      }
    }

    const working = this.cloneSnapshot(bestSnap, clampedIndex);
    const startIndex = bestSnap.stepIndex + 1;

    for (let i = startIndex; i <= clampedIndex; i++) {
      this.applyStep(working, this.steps[i], i);
    }

    working.stepIndex = clampedIndex;
    return working;
  }
}

