import React from 'react';
import { Compass, Zap, Flame, ShieldAlert, BarChart3 } from 'lucide-react';
import { MarketIndexData } from '../types';

interface MarketOverviewProps {
  marketIndex: MarketIndexData;
  darkMode: boolean;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  marketIndex,
  darkMode
}) => {
  const { fearGreedIndex, fearGreedSentiment, altcoinSeasonIndex, btcDominance, ethDominance, liquidations24h, totalMarketCap, marketCapChange24h } = marketIndex;

  // Calculate needle angle for Fear & Greed (0 to 100 maps to -90 deg to +90 deg)
  const fgAngle = (fearGreedIndex / 100) * 180 - 90;

  const longLiqPercent = Math.round((liquidations24h.longs / liquidations24h.total) * 100);
  const shortLiqPercent = 100 - longLiqPercent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Fear & Greed Index */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-blue-100/90 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Compass className="w-4 h-4 text-amber-500" />
            <span>FEAR & GREED INDEX</span>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            Live
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Gauge meter */}
          <div className="relative w-20 h-12 flex items-end justify-center overflow-hidden">
            <svg viewBox="0 0 100 50" className="w-20 h-10">
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke={darkMode ? '#1E293B' : '#E2E8F0'}
                strokeWidth="10"
                strokeLinecap="round"
              />
              <path
                d="M 10 50 A 40 40 0 0 1 90 50"
                fill="none"
                stroke="url(#fgGradient)"
                strokeWidth="10"
                strokeDasharray="125.6"
                strokeDashoffset={125.6 * (1 - fearGreedIndex / 100)}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
            </svg>
            <div 
              className="absolute bottom-0 w-1 h-8 bg-slate-900 dark:bg-white origin-bottom transition-transform duration-700 rounded-full"
              style={{ transform: `rotate(${fgAngle}deg)` }}
            />
            <div className="absolute bottom-0 w-2.5 h-2.5 rounded-full bg-blue-600" />
          </div>

          <div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-black font-mono tracking-tight text-emerald-500">
                {fearGreedIndex}
              </span>
              <span className="text-xs font-semibold text-slate-500">/ 100</span>
            </div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {fearGreedSentiment}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between border-t border-slate-100 dark:border-slate-800/80 pt-1.5">
          <span>Yesterday: 74 (Greed)</span>
          <span>Last Week: 68</span>
        </div>
      </div>

      {/* Altcoin Season Index */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-blue-100/90 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Zap className="w-4 h-4 text-blue-500" />
            <span>ALTCOIN SEASON INDEX</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            BTC Dominant
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-2xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {altcoinSeasonIndex}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {altcoinSeasonIndex >= 75 ? 'Altcoin Season!' : 'Bitcoin Season Zone'}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 via-blue-500 to-indigo-500 rounded-full transition-all duration-700"
              style={{ width: `${altcoinSeasonIndex}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-400 font-medium">
            <span>0 (Bitcoin Season)</span>
            <span>75 (Altcoin Season)</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Dominance Radar */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-blue-100/90 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            <span>MARKET DOMINANCE</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
            BTC {btcDominance}%
          </span>
        </div>

        <div className="space-y-2 mt-1">
          <div className="w-full h-3 rounded-md bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div 
              className="h-full bg-amber-500 transition-all" 
              style={{ width: `${btcDominance}%` }} 
              title={`Bitcoin: ${btcDominance}%`}
            />
            <div 
              className="h-full bg-blue-500 transition-all" 
              style={{ width: `${ethDominance}%` }} 
              title={`Ethereum: ${ethDominance}%`}
            />
            <div 
              className="h-full bg-indigo-500 transition-all flex-1" 
              title="Others: 29.8%"
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-slate-600 dark:text-slate-400">BTC {btcDominance}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 dark:text-slate-400">ETH {ethDominance}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-slate-600 dark:text-slate-400">Others {(100 - btcDominance - ethDominance).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 24h Liquidations Monitor */}
      <div className={`p-4 rounded-2xl border transition-all ${
        darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-blue-100/90 shadow-sm'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Flame className="w-4 h-4 text-rose-500" />
            <span>24H LIQUIDATIONS</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            Derivatives
          </span>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
              ${(liquidations24h.total / 1000000).toFixed(1)}M
            </span>
            <span className="text-xs font-semibold text-rose-500">
              Shorts Squeezed!
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex mt-2">
            <div 
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${longLiqPercent}%` }}
              title={`Longs: $${(liquidations24h.longs / 1000000).toFixed(1)}M`}
            />
            <div 
              className="h-full bg-rose-500 transition-all"
              style={{ width: `${shortLiqPercent}%` }}
              title={`Shorts: $${(liquidations24h.shorts / 1000000).toFixed(1)}M`}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono font-semibold pt-1.5">
            <span className="text-emerald-600 dark:text-emerald-400">
              Longs: ${(liquidations24h.longs / 1000000).toFixed(1)}M ({longLiqPercent}%)
            </span>
            <span className="text-rose-600 dark:text-rose-400">
              Shorts: ${(liquidations24h.shorts / 1000000).toFixed(1)}M ({shortLiqPercent}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
