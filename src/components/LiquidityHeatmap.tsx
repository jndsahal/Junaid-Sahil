import React, { useState } from 'react';
import { Flame, Layers, Info, Filter, ArrowUpRight, ArrowDownRight, Crosshair, Sparkles } from 'lucide-react';
import { INITIAL_LIQUIDITY_LEVELS_BTC } from '../data/mockData';
import { LiquidityLevel } from '../types';

interface LiquidityHeatmapProps {
  currentBtcPrice: number;
  darkMode: boolean;
}

export const LiquidityHeatmap: React.FC<LiquidityHeatmapProps> = ({
  currentBtcPrice,
  darkMode
}) => {
  const [selectedPair, setSelectedPair] = useState<'BTC' | 'ETH' | 'SOL'>('BTC');
  const [timeframe, setTimeframe] = useState<'12h' | '24h' | '3D' | '7D'>('24h');
  const [selectedLeverage, setSelectedLeverage] = useState<'all' | '100x' | '50x' | '25x' | '10x'>('all');
  const [viewMode, setViewMode] = useState<'heatmap' | 'ladder' | 'delta'>('heatmap');
  const [hoveredLevel, setHoveredLevel] = useState<LiquidityLevel | null>(null);

  // Scale levels according to selected pair
  const baseLevels = INITIAL_LIQUIDITY_LEVELS_BTC;
  const multiplier = selectedPair === 'BTC' ? 1 : selectedPair === 'ETH' ? (2740 / 94820) : (194.25 / 94820);
  const currentPairPrice = selectedPair === 'BTC' ? currentBtcPrice : selectedPair === 'ETH' ? 2740.80 : 194.25;

  const levels: LiquidityLevel[] = baseLevels.map(lvl => ({
    ...lvl,
    price: Math.round(lvl.price * multiplier * 100) / 100,
    volumeUsd: Math.round(lvl.volumeUsd * (selectedPair === 'BTC' ? 1 : selectedPair === 'ETH' ? 0.6 : 0.35) * 10) / 10
  })).filter(lvl => {
    if (selectedLeverage === 'all') return true;
    return `${lvl.leverage}x` === selectedLeverage;
  });

  const shortLevels = levels.filter(l => l.type === 'short').sort((a, b) => b.price - a.price);
  const longLevels = levels.filter(l => l.type === 'long').sort((a, b) => b.price - a.price);

  const totalShortLiq = shortLevels.reduce((acc, l) => acc + l.volumeUsd, 0);
  const totalLongLiq = longLevels.reduce((acc, l) => acc + l.volumeUsd, 0);

  // Helper function to get CoinGlass-style heat color
  const getHeatColor = (intensity: number, type: 'short' | 'long') => {
    if (intensity > 0.9) return 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/30';
    if (intensity > 0.75) return 'bg-orange-500 text-white font-semibold';
    if (intensity > 0.5) return 'bg-blue-600 text-white font-medium';
    return type === 'short' 
      ? 'bg-purple-600/80 text-purple-100' 
      : 'bg-indigo-600/80 text-indigo-100';
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all mb-6 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
    }`}>
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  CoinGlass Liquidity Heatmap
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                  Liquidation Cascade Radar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualizing high-leverage liquidation pools & magnetic attraction zones
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Pair Selector */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {(['BTC', 'ETH', 'SOL'] as const).map(pair => (
              <button
                key={pair}
                onClick={() => setSelectedPair(pair)}
                className={`px-2.5 py-1 font-bold rounded-md transition-all ${
                  selectedPair === pair 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                {pair}/USDT
              </button>
            ))}
          </div>

          {/* Timeframe */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {(['12h', '24h', '3D', '7D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 py-1 font-semibold rounded-md transition-all ${
                  timeframe === tf 
                    ? 'bg-slate-900 text-white dark:bg-blue-600' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Leverage Filter */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            {(['all', '100x', '50x', '25x', '10x'] as const).map(lev => (
              <button
                key={lev}
                onClick={() => setSelectedLeverage(lev)}
                className={`px-2 py-1 font-mono font-semibold rounded-md transition-all uppercase ${
                  selectedLeverage === lev 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {lev}
              </button>
            ))}
          </div>

          {/* View Mode */}
          <div className="inline-flex rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-2.5 py-1 font-semibold rounded-md ${viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('ladder')}
              className={`px-2.5 py-1 font-semibold rounded-md ${viewMode === 'ladder' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Ladder
            </button>
            <button
              onClick={() => setViewMode('delta')}
              className={`px-2.5 py-1 font-semibold rounded-md ${viewMode === 'delta' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
            >
              Delta
            </button>
          </div>
        </div>
      </div>

      {/* Magnetic Liquidity Zones Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          darkMode ? 'bg-rose-950/20 border-rose-900/50' : 'bg-rose-50/70 border-rose-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-500">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Upper Magnetic Pool (Short Squeeze)
              </span>
              <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                ${shortLevels[0]?.price.toLocaleString()} ({shortLevels[0]?.distancePct > 0 ? '+' : ''}{shortLevels[0]?.distancePct}%)
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Total Short Liqs</span>
            <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
              ${totalShortLiq.toFixed(1)}M
            </span>
          </div>
        </div>

        <div className={`p-3 rounded-xl border flex items-center justify-between ${
          darkMode ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-emerald-50/70 border-emerald-200'
        }`}>
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Lower Magnetic Pool (Long Flush)
              </span>
              <div className="text-sm font-extrabold font-mono text-slate-900 dark:text-white">
                ${longLevels[longLevels.length - 1]?.price.toLocaleString()} ({longLevels[longLevels.length - 1]?.distancePct}%)
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Total Long Liqs</span>
            <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
              ${totalLongLiq.toFixed(1)}M
            </span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Visualizer */}
      <div className={`relative rounded-xl border p-4 overflow-hidden font-mono ${
        darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-950 text-slate-100 border-slate-900'
      }`}>
        {/* Heat Intensity Legend */}
        <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Crosshair className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-slate-300">LIQUIDATION DENSITY HEATMAP</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px]">
            <span className="text-slate-400">Low</span>
            <span className="w-3 h-2 rounded-xs bg-purple-600"></span>
            <span className="w-3 h-2 rounded-xs bg-blue-600"></span>
            <span className="w-3 h-2 rounded-xs bg-orange-500"></span>
            <span className="w-3 h-2 rounded-xs bg-amber-400"></span>
            <span className="text-amber-400 font-bold">Ultra High (Magnet)</span>
          </div>
        </div>

        {/* Levels Container */}
        <div className="py-2 space-y-1.5">
          {/* Short Liquidation Levels (Above Spot) */}
          {shortLevels.map((lvl) => {
            const barWidthPercent = Math.min(100, Math.max(15, (lvl.volumeUsd / 200) * 100));

            return (
              <div
                key={lvl.price}
                onMouseEnter={() => setHoveredLevel(lvl)}
                onMouseLeave={() => setHoveredLevel(null)}
                className="group relative flex items-center justify-between px-3 py-1 rounded-md hover:bg-slate-900/90 cursor-pointer transition-all border border-transparent hover:border-slate-700"
              >
                <div className="flex items-center space-x-3 w-44 shrink-0">
                  <span className="text-xs font-bold text-rose-400">${lvl.price.toLocaleString()}</span>
                  <span className="text-[10px] px-1 rounded bg-rose-950/80 text-rose-300 border border-rose-800/60 font-semibold">
                    {lvl.leverage}x
                  </span>
                  <span className="text-[10px] text-slate-500">+{lvl.distancePct}%</span>
                </div>

                {/* Heatmap Bar */}
                <div className="flex-1 mx-3 h-4 bg-slate-900 rounded-sm overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-500 rounded-sm flex items-center justify-end px-2 ${getHeatColor(lvl.heatIntensity, 'short')}`}
                    style={{ width: `${barWidthPercent}%` }}
                  >
                    {lvl.heatIntensity > 0.8 && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        MAGNET
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-24 text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400">${lvl.volumeUsd}M</span>
                </div>
              </div>
            );
          })}

          {/* CURRENT SPOT PRICE DIVIDER */}
          <div className="my-2 py-2 px-3 rounded-lg bg-blue-600/30 border border-blue-500/80 flex items-center justify-between text-xs font-bold shadow-lg shadow-blue-500/10 animate-pulse">
            <div className="flex items-center space-x-2 text-blue-300">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping"></span>
              <span>SPOT CURRENT PRICE ({selectedPair}/USDT)</span>
            </div>
            <div className="text-sm font-black text-white font-mono tracking-wider">
              ${currentPairPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-blue-300 font-semibold">
              Live Binance Reference
            </div>
          </div>

          {/* Long Liquidation Levels (Below Spot) */}
          {longLevels.map((lvl) => {
            const barWidthPercent = Math.min(100, Math.max(15, (lvl.volumeUsd / 200) * 100));

            return (
              <div
                key={lvl.price}
                onMouseEnter={() => setHoveredLevel(lvl)}
                onMouseLeave={() => setHoveredLevel(null)}
                className="group relative flex items-center justify-between px-3 py-1 rounded-md hover:bg-slate-900/90 cursor-pointer transition-all border border-transparent hover:border-slate-700"
              >
                <div className="flex items-center space-x-3 w-44 shrink-0">
                  <span className="text-xs font-bold text-emerald-400">${lvl.price.toLocaleString()}</span>
                  <span className="text-[10px] px-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-semibold">
                    {lvl.leverage}x
                  </span>
                  <span className="text-[10px] text-slate-500">{lvl.distancePct}%</span>
                </div>

                {/* Heatmap Bar */}
                <div className="flex-1 mx-3 h-4 bg-slate-900 rounded-sm overflow-hidden flex items-center">
                  <div
                    className={`h-full transition-all duration-500 rounded-sm flex items-center justify-end px-2 ${getHeatColor(lvl.heatIntensity, 'long')}`}
                    style={{ width: `${barWidthPercent}%` }}
                  >
                    {lvl.heatIntensity > 0.8 && (
                      <span className="text-[9px] uppercase tracking-wider font-extrabold flex items-center space-x-1">
                        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                        MAGNET
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-24 text-right shrink-0">
                  <span className="text-xs font-bold text-amber-400">${lvl.volumeUsd}M</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hovered Level Inspector */}
        {hoveredLevel && (
          <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-300">
            <div>
              Level: <strong className="text-white">${hoveredLevel.price.toLocaleString()}</strong> | 
              Pool: <strong className="text-amber-400">${hoveredLevel.volumeUsd}M</strong> | 
              Type: <span className={hoveredLevel.type === 'short' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {hoveredLevel.type.toUpperCase()} LIQUIDATION
              </span>
            </div>
            <div>
              Est. Accounts Liquidated: <strong className="text-white">{hoveredLevel.liquidationsCount.toLocaleString()}</strong> | 
              Distance: <strong>{hoveredLevel.distancePct}%</strong>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2">
        <span className="flex items-center space-x-1">
          <Info className="w-3.5 h-3.5 text-blue-500" />
          <span>CoinGlass liquidation model estimates accumulated liquidation leverage clusters from Binance, Bybit & OKX order books.</span>
        </span>
        <span className="font-semibold text-blue-600 dark:text-blue-400">
          Sync Rate: 1s
        </span>
      </div>
    </div>
  );
};
