import React, { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { TreeView } from './components/TreeView';
import { StackPanel } from './components/StackPanel';
import { VisitedPanel } from './components/VisitedPanel';
import { NodeInspector } from './components/NodeInspector';
import { StatsPanel } from './components/StatsPanel';
import { ComparisonPanel } from './components/ComparisonPanel';
import { PseudocodePanel } from './components/PseudocodePanel';
import { Legend } from './components/Legend';
import { ExplainPanel } from './components/ExplainPanel';
import { SetupEditor } from './components/SetupEditor';
import {
  Layers,
  CheckCircle2,
  Search,
  BarChart3,
  BookOpen,
  Sun,
  Moon,
  GraduationCap,
} from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeTab,
    theme,
    currentTreeSnapshot,
    setActiveTab,
    setTheme,
  } = useGameStore();

  useEffect(() => {
    // Set initial theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const stackCount = currentTreeSnapshot?.stack.length ?? 0;
  const closedCount = currentTreeSnapshot?.visitedIds.length ?? 0;
  const prunedCount = currentTreeSnapshot?.prunedIds.length ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-black text-transparent bg-clip-text bg-gradient-to-tr from-indigo-400 to-cyan-400 text-sm">
              αβ
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-white">
                Tic-Tac-Toe Minimax & Alpha-Beta Visualizer
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                <GraduationCap className="w-3 h-3" /> AI Course Project
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Interactive State-Space Tree Exploration • Step Engine • Real-time Cutoff Analysis
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('explain')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Course Guide</span>
          </button>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </header>

      {/* Main 3-Column Studio Layout */}
      <main className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        {/* Left Column: Board + Playback Controls + Settings (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-3 lg:overflow-y-auto pr-0 lg:pr-1">
          <Board />
          <Controls />
        </div>

        {/* Center Column: The Search Tree View (lg:col-span-6) */}
        <div className="lg:col-span-6 min-h-[480px] lg:min-h-0 flex flex-col">
          <TreeView />
        </div>

        {/* Right Column: Tabbed Panels & Analytics (lg:col-span-3) */}
        <div className="lg:col-span-3 flex flex-col gap-3 lg:overflow-y-auto pl-0 lg:pl-1">
          {/* Tabs Container */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden backdrop-blur-md">
            {/* Tab Buttons Header */}
            <div className="flex items-center border-b border-slate-800 bg-slate-950/60 p-1.5 gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('stack')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'stack'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="DFS Call Stack / Frontier"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stack</span>
                {stackCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] bg-slate-900 text-slate-300">
                    {stackCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('visited')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'visited'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Closed and Pruned Lists"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Closed</span>
                {closedCount + prunedCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full text-[9px] bg-slate-900 text-slate-300">
                    {closedCount} | ✂{prunedCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('inspector')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'inspector'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Node Inspector"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Inspect</span>
              </button>

              <button
                onClick={() => setActiveTab('comparison')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'comparison'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
                title="Minimax vs Alpha-Beta Benchmark"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Compare</span>
              </button>
            </div>

            {/* Active Tab Content */}
            <div className="flex-1">
              {activeTab === 'stack' && <StackPanel />}
              {activeTab === 'visited' && <VisitedPanel />}
              {activeTab === 'inspector' && <NodeInspector />}
              {activeTab === 'comparison' && <ComparisonPanel />}
              {activeTab === 'explain' && <ExplainPanel />}
            </div>
          </div>

          {/* Live Search Stats Panel */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-md">
            <StatsPanel />
          </div>

          {/* Interactive Pseudocode Trace */}
          <PseudocodePanel />

          {/* Visual Legend */}
          <Legend />
        </div>
      </main>

      {/* Setup Editor Modal */}
      <SetupEditor />
    </div>
  );
};
export default App;
