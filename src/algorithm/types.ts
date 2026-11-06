export type Player = 'X' | 'O';
export type Cell = Player | null;
export type Board = Cell[];

export type NodeType = 'MAX' | 'MIN';
export type MoveOrdering = 'natural' | 'strategic';

export type LeafReason = 'X_WINS' | 'O_WINS' | 'DRAW';

export interface PrunedChild {
  nodeId: string;
  parentId: string;
  move: number;
  board: Board;
  depth: number;
  nodeType: NodeType;
}

export type Step =
  | {
      type: 'ENTER_NODE';
      nodeId: string;
      parentId: string | null;
      board: Board;
      move: number | null;
      depth: number;
      nodeType: NodeType;
      alpha: number;
      beta: number;
      description: string;
    }
  | {
      type: 'EVALUATE_LEAF';
      nodeId: string;
      value: number;
      reason: LeafReason;
      description: string;
    }
  | {
      type: 'UPDATE_VALUE';
      nodeId: string;
      value: number;
      description: string;
    }
  | {
      type: 'UPDATE_ALPHA';
      nodeId: string;
      oldAlpha: number;
      newAlpha: number;
      description: string;
    }
  | {
      type: 'UPDATE_BETA';
      nodeId: string;
      oldBeta: number;
      newBeta: number;
      description: string;
    }
  | {
      type: 'PRUNE';
      nodeId: string;
      prunedChildMoves: number[];
      prunedNodes: PrunedChild[];
      alpha: number;
      beta: number;
      description: string;
    }
  | {
      type: 'EXIT_NODE';
      nodeId: string;
      returnValue: number;
      description: string;
    }
  | {
      type: 'CHOOSE_MOVE';
      nodeId: string;
      move: number;
      value: number;
      description: string;
    };

export interface SearchCounters {
  nodesExpanded: number; // Every entered node
  nodesPruned: number; // Number of prune trigger occurrences / skipped branches
  prunedSubtreeEstimate: number; // Estimated count of nodes saved
  leavesEvaluated: number; // Terminal positions evaluated
  maxDepth: number; // Maximum depth reached
  timeMs: number; // Time elapsed in milliseconds
}

export interface TreeNodeData {
  id: string;
  parentId: string | null;
  board: Board;
  move: number | null;
  depth: number;
  nodeType: NodeType;
  isPrunedPlaceholder?: boolean;
  alpha?: number;
  beta?: number;
  value?: number;
  bestChildMove?: number;
  children: string[];
}

export interface SearchResult {
  bestMove: number | null;
  bestValue: number;
  steps: Step[];
  counters: SearchCounters;
  truncated: boolean;
  warning?: string;
  principalVariation: number[];
}

export interface BenchmarkMetrics {
  nodesExpanded: number;
  nodesPruned: number;
  leavesEvaluated: number;
  maxDepth: number;
  timeMs: number;
}

export interface BenchmarkResult {
  minimax: BenchmarkMetrics;
  alphaBetaNatural: BenchmarkMetrics;
  alphaBetaStrategic: BenchmarkMetrics;
  reductionNaturalPct: number;
  reductionStrategicPct: number;
}

