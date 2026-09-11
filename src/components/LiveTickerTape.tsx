import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoPair } from '../types';

interface LiveTickerTapeProps {
  pairs: CryptoPair[];
  onSelectPair: (pair: CryptoPair) => void;
  darkMode: boolean;
}

export const LiveTickerTape: React.FC<LiveTickerTapeProps> = ({
  pairs,
  onSelectPair,
  darkMode
}) => {
  // Take top 10 most liquid pairs for ticker bar
  const topTickerPairs = pairs.slice(0, 12);

  return (
    <div className={`w-full overflow-hidden border-b transition-colors py-2 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100/80 shadow-xs'
    }`}>
      <div className="flex items-center space-x-6 px-4 overflow-x-auto scrollbar-none whitespace-nowrap">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0 uppercase tracking-wider pr-2 border-r border-slate-200 dark:border-slate-800">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          <span>TICKER</span>
        </div>

        {topTickerPairs.map((pair) => {
          const isPositive = pair.priceChange24h >= 0;
          const priceStr = pair.price > 100 
            ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : pair.price > 1 
              ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
              : pair.price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });

          return (
            <div
              key={pair.id}
              onClick={() => onSelectPair(pair)}
              className={`inline-flex items-center space-x-2.5 px-3 py-1 rounded-lg cursor-pointer transition-all shrink-0 text-xs font-mono select-none hover:scale-102 ${
                darkMode
                  ? 'hover:bg-slate-800/80 text-slate-200'
                  : 'hover:bg-blue-50/70 text-slate-800 border border-transparent hover:border-blue-200'
              }`}
            >
              <span className="font-bold text-slate-900 dark:text-white font-sans">{pair.symbol}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">${priceStr}</span>
              <span className={`inline-flex items-center space-x-0.5 text-[11px] font-bold ${
                isPositive ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{isPositive ? '+' : ''}{pair.priceChange24h.toFixed(2)}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
