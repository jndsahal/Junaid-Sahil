import React from 'react';
import { Activity, Flame, Layers, PieChart, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  activeView: 'dashboard' | 'heatmap' | 'orderblocks' | 'portfolio';
  setActiveView: (view: 'dashboard' | 'heatmap' | 'orderblocks' | 'portfolio') => void;
  onOpenSecurity: () => void;
  darkMode: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  setActiveView,
  onOpenSecurity,
  darkMode
}) => {
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t py-2 px-3 flex items-center justify-around backdrop-blur-md safe-area-pb transition-colors ${
      darkMode 
        ? 'bg-[#0B1120]/95 border-slate-800 text-slate-400' 
        : 'bg-white/95 border-blue-100 text-slate-500 shadow-lg'
    }`}>
      <button
        onClick={() => setActiveView('dashboard')}
        className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
          activeView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-700'
        }`}
      >
        <Activity className="w-5 h-5" />
        <span>Top 50</span>
      </button>

      <button
        onClick={() => setActiveView('heatmap')}
        className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
          activeView === 'heatmap' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-700'
        }`}
      >
        <Flame className="w-5 h-5" />
        <span>Heatmap</span>
      </button>

      <button
        onClick={() => setActiveView('orderblocks')}
        className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
          activeView === 'orderblocks' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-700'
        }`}
      >
        <Layers className="w-5 h-5" />
        <span>Order Blocks</span>
      </button>

      <button
        onClick={() => setActiveView('portfolio')}
        className={`flex flex-col items-center space-y-1 text-[10px] font-bold ${
          activeView === 'portfolio' ? 'text-blue-600 dark:text-blue-400' : 'hover:text-slate-700'
        }`}
      >
        <PieChart className="w-5 h-5" />
        <span>Portfolio</span>
      </button>

      <button
        onClick={onOpenSecurity}
        className="flex flex-col items-center space-y-1 text-[10px] font-bold hover:text-slate-700"
      >
        <ShieldCheck className="w-5 h-5 text-emerald-500" />
        <span>Security</span>
      </button>
    </div>
  );
};
