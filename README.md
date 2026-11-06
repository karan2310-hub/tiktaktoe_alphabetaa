# Minimax with Alpha-Beta Pruning Visualizer (Tic-Tac-Toe)

An interactive, animated single-page web app that visualizes the **Minimax** game-tree search with **Alpha-Beta Pruning** playing Tic-Tac-Toe. You can watch the tree grow node by node, see α/β values update live, and see pruned branches turn gray in real time.

Built as part of an Artificial Intelligence course project (Topic: Adversarial Search).



---

## Features

**Algorithm**
- Plain Minimax and Minimax with Alpha-Beta Pruning, both written in pure TypeScript with no React or DOM imports.
- Depth-aware scoring: AI win = `+10 - depth`, AI loss = `depth - 10`, draw = `0`. This makes the AI prefer faster wins and delay losses.
- Two move-ordering modes for Alpha-Beta: natural order (cells 0 to 8) and strategic order (center, then corners, then edges).

**Visualization**
- Animated SVG game tree. Each node shows a mini board, its type (MAX/MIN), live α, β, and value.
- Nodes appear as they are expanded. Pruned branches turn gray with a dashed border and a cut mark on the edge.
- Pan, zoom, fit-to-screen, auto-follow camera, and vertical/horizontal layout toggle.
- Click a finished node to collapse its subtree into a `+N` badge. Optional auto-collapse for large trees.
- Node Inspector shows the board, depth, α/β history, and value of any node you click.

**Playback controls**
- Play, Pause, Step Forward, Step Back, Reset, Skip to End.
- Speed slider and a draggable timeline scrubber (step i / N).
- Keyboard shortcuts (see below).

**Panels**
- **Recursion Stack** (the frontier / open list of DFS-style minimax)
- **Visited / Closed list** and a separate **Pruned** list
- **Live stats**: nodes expanded, nodes pruned, leaves evaluated, current depth, current α/β, best move so far, principal variation
- **Pseudocode panel** with the active line highlighted for each step
- **Comparison panel**: Minimax vs Alpha-Beta (natural) vs Alpha-Beta (strategic) with a table and bar chart
- **Setup editor** to build any valid board position and analyze it
- **Explain tab** with a short guide on minimax, α, β, and pruning

**Other**
- Play against the AI, with undo, new game, and swap sides.
- Light and dark mode.

---

## Tech Stack

- Vite + React 18 + TypeScript (strict mode)
- Tailwind CSS
- Zustand (state management)
- d3-hierarchy (tree layout coordinates only) and d3-zoom (pan/zoom)
- SVG rendering written directly in React
- Web Worker for benchmarks
- Vitest for tests

No backend, no server, no database. Everything runs in the browser, and the build output is a static site.

---

## Getting Started

**Prerequisites:** Node.js 18 or newer, npm 9 or newer.

```bash
git clone https://github.com/karan2310-hub/tiktaktoe_alphabeta.git
cd 3.gtsir_project
npm install
npm run dev
```

Other commands:

```bash
npm test            # run the Vitest test suite once
npm run test:watch  # tests in watch mode
npm run build       # typecheck and build the static site
npm run preview     # preview the production build locally
```

---

## Project Structure

```
src/
├── algorithm/               # Pure TypeScript, no React or DOM
│   ├── board.ts             # Board representation, legal moves, winner/terminal check
│   ├── minimax.ts           # Plain Minimax with step recording
│   ├── alphabeta.ts         # Alpha-Beta with step recording and move ordering
│   ├── benchmark.ts         # Counter-only versions (no recording) for fast benchmarking
│   ├── types.ts             # Step, Board and result types
│   └── algorithm.test.ts    # Vitest tests
├── store/
│   ├── gameStore.ts         # Zustand store (game, playback, settings)
│   └── treeState.ts         # Snapshot cache for fast scrubbing
├── workers/
│   ├── benchmark.worker.ts  # Runs benchmarks off the UI thread
│   └── benchmarkClient.ts   # Async wrapper around the worker
├── components/              # Board, Controls, TreeView, StackPanel, VisitedPanel,
│                            # NodeInspector, StatsPanel, ComparisonPanel,
│                            # PseudocodePanel, SetupEditor, Legend, ExplainPanel
├── App.tsx
├── main.tsx
└── index.css
```

---

## How It Works: Step Recording

A common way to build algorithm visualizers is to run the algorithm slowly with timers or generators. That makes step-back very hard, because you cannot easily "un-run" a recursive search.

This project does it differently:

1. **Search phase:** the algorithm runs to completion first, and records every event into a `steps: Step[]` array.
2. **Snapshot cache:** the app stores a snapshot of the tree state every 100 steps.
3. **Playback:** the animation engine only moves an integer index (`currentStepIndex`) over the array. To jump to any step, it loads the nearest earlier snapshot and replays at most 100 steps. So step-back and scrubbing are always fast and never re-run the search.

Step types:

```typescript
type Step =
  | { type: 'ENTER_NODE'; nodeId; parentId; board; move; depth; nodeType: 'MAX' | 'MIN'; alpha; beta; description }
  | { type: 'EVALUATE_LEAF'; nodeId; value; reason: 'X_WINS' | 'O_WINS' | 'DRAW'; description }
  | { type: 'UPDATE_VALUE'; nodeId; value; description }
  | { type: 'UPDATE_ALPHA'; nodeId; oldAlpha; newAlpha; description }
  | { type: 'UPDATE_BETA'; nodeId; oldBeta; newBeta; description }
  | { type: 'PRUNE'; nodeId; prunedChildMoves; prunedNodes; alpha; beta; description }
  | { type: 'EXIT_NODE'; nodeId; returnValue; description }
  | { type: 'CHOOSE_MOVE'; nodeId; move; value; description };
```

(Simplified for readability. See `src/algorithm/types.ts` for the exact definition.)

---

## Two Modes

Tic-Tac-Toe from an empty board has about 550 thousand nodes in plain Minimax. That is far too many to draw as SVG, so the app has two modes:

- **Visualization mode:** records every step and draws the tree. Best for mid-game positions. If a position would produce too many nodes (about 40,000), the app warns you and lets you limit the visualized depth.
- **Benchmark mode:** counter-only versions of the algorithms (no recording, no drawing) running inside a Web Worker, so even the empty board runs without freezing the UI.

---

## Frontier and Visited in DFS-Style Minimax

In BFS or A*, the **frontier** is the list of discovered-but-unexpanded nodes, and the **closed list** holds expanded nodes. Minimax is depth-first, so the mapping is different:

- **Frontier / Open list** = the **recursion call stack**: the chain of nodes from the root down to the node currently being processed.
- **Visited / Closed set** = nodes that have finished evaluation and returned their value to the parent (`EXIT_NODE`).
- **Pruned set** = child nodes that were never entered because the cutoff condition `β ≤ α` proved they cannot change the root decision.

---

## Performance Results (Empty Board)

Measured from the empty 3x3 board.

| Metric | Plain Minimax | Alpha-Beta (natural order) | Alpha-Beta (strategic order) |
| :--- | :---: | :---: | :---: |
| Nodes expanded | 549,946 | 20,866 | 7,865 |
| Leaves evaluated | 255,168 | 8,453 | 3,161 |
| Cutoffs triggered | 0 | 7,788 | 3,694 |
| Time (ms) | 91.35 | 4.18 | 1.99 |
| Reduction vs Minimax | 0% | 96.2% | 98.6% |
| Root value | 0 (draw) | 0 (draw) | 0 (draw) |

Time was measured on a Windows laptop (Node.js v26.13.0 / Chrome V8 runtime, median of 5 independent trials) and will vary between machines.

**Observations**
1. Minimax and Alpha-Beta give the same root value, as the theory says: pruning never changes the result, only the work done.
2. Move ordering matters a lot. Checking the center first, then corners, then edges cuts the search by a further 62.3% compared to natural order (20,866 down to 7,865), because strong moves are found early and set tight α/β bounds sooner.

---

## Testing

Tests are written with Vitest and cover:

- Minimax and Alpha-Beta return the same root value on every position reachable within 3 moves of the empty board.
- The AI never loses against a brute-force opponent that tries every possible human move.
- Plain Minimax expands exactly 549,946 nodes from the empty board, and Alpha-Beta expands strictly fewer.
- The AI takes an immediate win and blocks an immediate loss.

Latest run: 7 of 7 tests passing (`npm test`).

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Right Arrow` | Step forward |
| `Left Arrow` | Step back |
| `Home` | Jump to start |
| `End` | Jump to end |

---

## Limitations and Future Work

- **Transpositions:** this tree treats the same board state reached by different move orders as separate nodes. Tic-Tac-Toe has 5,478 distinct reachable board positions (reduced to 765 equivalence classes only when 8-fold dihedral symmetry — rotations and reflections — is applied). A transposition table would eliminate duplicate evaluations across different move paths, but the visualization would become a directed acyclic graph (DAG) rather than a tree.
- **Rendering cap:** SVG slows down with very large trees, so the visualization mode caps the number of nodes and supports depth limiting and subtree collapsing.
- **Other games:** the algorithm layer is independent of the UI, so the same visualizer could be extended to other small games (Connect-3, Nim).

---

## Team

**Team Leader:** Karan Pandey

| Role | Responsibilities | Member |
| :--- | :--- | :--- |
| Algorithm & Backend Logic (Team Lead) | Minimax, Alpha-Beta Pruning, move ordering, step recorder, benchmark logic, project coordination and integration | Karan Pandey |
| Visualization Engine | Tree layout (d3-hierarchy), SVG rendering, node animations, pruning effects, zoom/pan, snapshot cache | Rishav |
| UI/UX & Controls | Overall layout, board, playback controls, speed slider, panels, setup editor, light/dark theme | Sanat |
| Testing, Analysis & Documentation | Vitest tests, benchmark analysis, report, demo video | Kanishka |

---

