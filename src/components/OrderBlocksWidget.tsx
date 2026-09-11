import React, { useState } from 'react';
import { Layers, ShieldCheck, CheckCircle2, Clock, Zap, ArrowUp, ArrowDown } from 'lucide-react';
import { INITIAL_ORDER_BLOCKS } from '../data/mockData';
import { OrderBlock } from '../types';

interface OrderBlocksWidgetProps {
  darkMode: boolean;
  onSelectPair?: (symbol: string) => void;
}

export const OrderBlocksWidget: React.FC<OrderBlocksWidgetProps> = ({
  darkMode,
  onSelectPair
}) => {
  const [blocks, setBlocks] = useState<OrderBlock[]>(INITIAL_ORDER_BLOCKS);
  const [filterType, setFilterType] = useState<'all' | 'bullish' | 'bearish' | 'breaker'>('all');
  const [selectedTf, setSelectedTf] = useState<'all' | '15m' | '1h' | '4h' | '1D'>('all');

  const filteredBlocks = blocks.filter(b => {
    if (filterType !== 'all' && b.type !== filterType) return false;
    if (selectedTf !== 'all' && b.timeframe !== selectedTf) return false;
    return true;
  });

  return (
    <div className={`p-5 rounded-2xl border transition-all mb-6 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Institutional Order Blocks (ICT / SMC)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300">
                Smart Money Tracking
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Institutional supply & demand footprints, breaker blocks, and mitigation state
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Type */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {(['all', 'bullish', 'bearish', 'breaker'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 font-semibold rounded-md capitalize transition-all ${
                  filterType === type 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Timeframe */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {(['all', '15m', '1h', '4h', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setSelectedTf(tf)}
                className={`px-2 py-1 font-semibold rounded-md transition-all ${
                  selectedTf === tf 
                    ? 'bg-slate-900 text-white dark:bg-blue-600' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Order Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
        {filteredBlocks.map((ob) => {
          const isBullish = ob.type === 'bullish';
          const isBearish = ob.type === 'bearish';

          return (
            <div
              key={ob.id}
              onClick={() => onSelectPair && onSelectPair(ob.symbol.split('/')[0])}
              className={`p-4 rounded-xl border transition-all cursor-pointer hover:scale-[1.01] ${
                darkMode 
                  ? 'bg-slate-950/60 border-slate-800/90 hover:border-blue-600' 
                  : 'bg-slate-50/70 border-slate-200/90 hover:border-blue-300 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                    {ob.symbol}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ob.timeframe}
                  </span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                    isBullish 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300' 
                      : isBearish
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                        : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300'
                  }`}>
                    {isBullish ? <ArrowUp className="w-3 h-3" /> : isBearish ? <ArrowDown className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
                    <span className="capitalize">{ob.type} OB</span>
                  </span>
                </div>
              </div>

              {/* Price Band */}
              <div className="my-2.5 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Range:</span>
                  <span className="text-slate-900 dark:text-white">
                    ${ob.lowPrice.toLocaleString()} – ${ob.highPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] mt-1 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <span className="text-slate-400">Volume Delta:</span>
                  <span className={ob.volumeDeltaUsd > 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                    {ob.volumeDeltaUsd > 0 ? '+' : ''}${(ob.volumeDeltaUsd / 1000000).toFixed(0)}M
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {ob.description}
              </p>

              {/* Footer status */}
              <div className="flex items-center justify-between text-[11px] mt-3 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <span className={`inline-flex items-center space-x-1 font-semibold ${
                  ob.mitigated ? 'text-slate-400' : 'text-amber-500 font-bold'
                }`}>
                  {ob.mitigated ? (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-slate-400" />
                      <span>Mitigated</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                      <span>Fresh / Unmitigated (Active)</span>
                    </>
                  )}
                </span>
                <span className="text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{ob.timestamp}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
