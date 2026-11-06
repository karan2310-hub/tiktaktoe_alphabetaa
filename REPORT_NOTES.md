# AI Course Project: Demo Video Script & Final Report Notes

This document provides a **5-minute demo video script outline with exact timestamps** and a **structured report summary** that your team can use for course presentations and final submission.

---

## Part 1: 5-Minute Video Presentation Script

### ⏱️ Timestamp Breakdown & Narration Guide

#### [0:00 - 0:45] Introduction & Motivation
- **Presenter**: Karan Pandey (Team Leader, Algorithm & Backend Logic)
- **Visuals**: Show full application loaded with the 3-column studio layout.
- **Talking Points**:
  - Introduce project: Interactive visualizer of **Minimax with Alpha-Beta Pruning** in Tic-Tac-Toe.
  - Explain the academic motivation: Minimax exhaustively searches game trees, but its exponential branching makes deep exploration expensive. Alpha-Beta pruning guarantees mathematical equivalence while drastically reducing state expansions.
  - Highlight key tech stack choices: Pure TypeScript algorithm core, React 18, Zustand, SVG rendering via `d3-hierarchy` coordinates, and background Web Worker benchmarks.

#### [0:45 - 2:00] Algorithm Correctness, Step Engine & Tree Visualization
- **Presenter**: Rishav (Visualization Engine Lead)
- **Visuals**:
  1. Select preset: *"Block-the-Win Scenario"* or *"Mid-Game: 3 Moves Played"*.
  2. Press **Play**, show tree expanding dynamically with nodes pulsing in real time.
  3. Pause the animation. Use **Step Forward** and **Step Backward** to show seamless bidirectional scrubbing.
  4. Point out a **Pruned Cutoff event (✂)**:
     - Show the red scissors mark and dashed gray line.
     - Read the description bar: *"β (0) <= α (0). Cutoff triggered! Pruning remaining child branches."*
     - Show the pseudocode panel highlighting `if β <= α: break`.
  5. Demonstrate **Interactive Tree Features**:
     - Toggle between **Vertical** and **Horizontal** layouts.
     - Pan & Zoom with mouse wheel, click **Fit to Screen**.
     - Click a node to open the **Node Inspector**, showing its local $3 \times 3$ board and $[\alpha, \beta]$ history.
     - Click a completed node to collapse its subtree into a `+N` badge.

#### [2:00 - 3:15] Academic Panels: Stack, Visited, and Live Inspector
- **Presenter**: Sanat (UI/UX & Controls Lead)
- **Visuals**:
  1. Switch to **Stack Panel**:
     - Explain how the DFS recursion stack represents the **Frontier / Open List** in depth-first search.
     - Show depth indicators and current $[\alpha, \beta]$ bounds updating.
  2. Switch to **Closed / Visited Panel**:
     - Show the list of closed nodes with their returned leaf utility.
     - Show the **Pruned** sub-tab listing skipped branches.
  3. Switch to **Stats Panel**:
     - Point out live metrics: Nodes Expanded, Nodes Pruned, Leaves Evaluated, and Principal Variation (PV).
  4. Demonstrate **Custom Setup Editor**:
     - Open setup modal, click cells to configure a custom position.
     - Intentionally make an invalid piece count to showcase client-side validation, then fix it and click *"Analyze This Position"*.

#### [3:15 - 4:15] Performance Analysis & Web Worker Benchmarking
- **Presenter**: Kanishka (Testing, Analysis & Documentation Lead)
- **Visuals**:
  1. Open **Comparison Panel**.
  2. Select **Empty Board** and click **Run Comparison**.
  3. Point out that the UI remains completely responsive with a live spinner because the benchmark runs inside a **Web Worker**.
  4. Review the generated metrics table and bar chart:
     - **Plain Minimax**: 549,946 nodes expanded (median: 91.35 ms).
     - **Alpha-Beta (Natural)**: 20,866 nodes expanded, 7,788 cutoffs (**96.2% reduction**, median: 4.18 ms).
     - **Alpha-Beta (Strategic: Center $\to$ Corners $\to$ Edges)**: 7,865 nodes expanded, 3,694 cutoffs (**98.6% reduction**, median: 1.99 ms).
  5. Explain the importance of move ordering in maximizing cutoffs.

#### [4:15 - 5:00] Testing Rigor, Conclusion & Q&A Handoff
- **Presenter**: All Team Members (Karan Pandey, Rishav, Sanat, Kanishka)
- **Visuals**: Show terminal running `npm test` with all 7 test suites passing.
- **Talking Points**:
  - Summary of testing coverage: invariant check against brute-force opponents (AI never loses), identical root evaluations across depth-3 states, immediate win/block detection, and exact node count verification (549,946 nodes).
  - Concluding remarks on how visual interactive time-travel transforms theoretical understanding of zero-sum game trees.

---

## Part 2: Final Written Report Outline & Bullet Points

### 1. Abstract & Problem Statement
- **Domain**: Two-player, zero-sum, perfect-information deterministic game.
- **Goal**: Implement optimal minimax decision-making, evaluate the state-space reduction achievable through alpha-beta pruning, and design an educational interactive visualization for AI learners.

### 2. Formal Algorithm Specification
- **State Representation**: Array of 9 cells $\in \{'X', 'O', \text{null}\}$.
- **Utility Function**:
  $$\text{Utility}(s, d) = \begin{cases} +10 - d & \text{if AI wins at depth } d \\ d - 10 & \text{if opponent wins at depth } d \\ 0 & \text{if draw} \end{cases}$$
- **Alpha-Beta Recurrence**:
  $$\alpha = \max(\alpha, \text{childValue}), \quad \beta = \min(\beta, \text{childValue})$$
  $$\text{Cutoff Condition}: \quad \beta \le \alpha$$

### 3. Move Ordering Evaluation
- **Natural Ordering ($0 \to 8$)**: Examines top-left to bottom-right. Prunes effectively ($96.2\%$ reduction), but suboptimal branches may be explored before dominant central moves.
- **Strategic Ordering ($4 \to \{0, 2, 6, 8\} \to \{1, 3, 5, 7\}$)**:
  - Center controls 4 winning lines (row 2, col 2, both diagonals).
  - Corners control 3 winning lines each.
  - Edges control only 2 winning lines.
  - Prioritizing higher-utility branches exposes strong bounds earlier, compressing nodes explored from 20,866 down to **7,865** ($98.6\%$ overall reduction, saving an extra $62.3\%$ over natural order).

### 4. Architectural Innovations
- **Synchronous Step-Recording Engine**: Complete separation of algorithmic execution from UI rendering. Recording an array of discriminated union events enables fast, predictable bidirectional scrubbing without time-bound yields or re-running the search.
- **Snapshot Caching (`TreeStateCache`)**: Storing tree snapshots every 100 steps ensures that scrubbing to any step requires replaying at most 99 steps from the nearest snapshot instead of starting from step 0.
- **Web Worker Offloading**: CPU-intensive combinatorial benchmarks run in an isolated worker thread, keeping the UI fully interactive and preventing main-thread lockups.

### 5. Known Limitations & Future Work
- **Transposition Tables / DAG Visualizations**: In this project, Minimax explores a tree where transpositions (identical positions reached via different permutations of moves) are evaluated independently. Tic-Tac-Toe has 5,478 distinct reachable board positions (reduced to 765 equivalence classes only when 8-fold dihedral symmetry — rotations and reflections — is applied). A transposition table would eliminate redundant path evaluations, but the visualization would become a directed acyclic graph (DAG) rather than a tree.
- **Scale Cap for Rendering**: Visualizing more than ~40,000 SVG nodes simultaneously strains browser DOM memory. The app handles this via depth-limiting caps (1 to 9 plies) and subtree folding.
