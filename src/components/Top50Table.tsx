import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Search, 
  ChevronRight, 
  Sparkles,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { CryptoPair, MarketCategory } from '../types';

interface Top50TableProps {
  pairs: CryptoPair[];
  onSelectPair: (pair: CryptoPair) => void;
  darkMode: boolean;
  searchQuery: string;
}

export const Top50Table: React.FC<Top50TableProps> = ({
  pairs,
  onSelectPair,
  darkMode,
  searchQuery
}) => {
  const [activeCategory, setActiveCategory] = useState<MarketCategory>('all');
  const [sortField, setSortField] = useState<keyof CryptoPair>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<1 | 2>(1); // 1-25 or 26-50

  const handleSort = (field: keyof CryptoPair) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' ? 'asc' : 'desc');
    }
  };

  // Filtering
  const filteredPairs = pairs.filter(pair => {
    const matchesSearch = 
      pair.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pair.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCat = activeCategory === 'all' || pair.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  // Sorting
  const sortedPairs = [...filteredPairs].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return 0;
  });

  // Pagination: 25 items per view or all if searching
  const pageSize = 25;
  const displayPairs = searchQuery ? sortedPairs : sortedPairs.slice((page - 1) * pageSize, page * pageSize);

  // Sparkline renderer
  const renderSparkline = (data: number[], isPositive: boolean) => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 120;
    const height = 34;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    }).join(' ');

    const strokeColor = isPositive ? '#10B981' : '#F43F5E';
    const fillColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={fillColor}
        />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all mb-6 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
    }`}>
      {/* Table Header & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top 50 Crypto Market Pairs
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300">
              Live CoinMarketCap Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time pricing, order flows, 24h volume, liquidity depth & sparkline performance
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { id: 'all', label: 'All Pairs (50)' },
            { id: 'layer1', label: 'Layer 1' },
            { id: 'defi', label: 'DeFi' },
            { id: 'ai', label: 'AI & DePIN' },
            { id: 'meme', label: 'Memes' },
            { id: 'l2', label: 'Layer 2' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as MarketCategory)}
              className={`px-3 py-1 font-semibold rounded-lg transition-all ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Responsive Table */}
      <div className="overflow-x-auto mt-2 -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
              darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500 bg-slate-50/50'
            }`}>
              <th 
                onClick={() => handleSort('rank')} 
                className="py-3 px-3 cursor-pointer select-none hover:text-blue-600"
              >
                <div className="flex items-center space-x-1">
                  <span>#</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">Name / Symbol</th>
              <th 
                onClick={() => handleSort('price')} 
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-blue-600"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Price (USD)</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('priceChange24h')} 
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-blue-600"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>24h %</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('volume24h')} 
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-blue-600 hidden md:table-cell"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>24h Volume</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('marketCap')} 
                className="py-3 px-3 text-right cursor-pointer select-none hover:text-blue-600 hidden lg:table-cell"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Market Cap</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3 text-center hidden xl:table-cell">
                Inflow vs Outflow
              </th>
              <th className="py-3 px-3 text-center hidden sm:table-cell">
                Last 7 Days
              </th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {displayPairs.map((pair) => {
              const isPositive = pair.priceChange24h >= 0;
              const hasTickUp = pair.prevPrice !== undefined && pair.price > pair.prevPrice;
              const hasTickDown = pair.prevPrice !== undefined && pair.price < pair.prevPrice;

              const totalFlow = pair.inflow24h + pair.outflow24h;
              const inflowPct = Math.round((pair.inflow24h / totalFlow) * 100);

              const formattedPrice = pair.price > 100
                ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : pair.price > 1
                  ? pair.price.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
                  : pair.price.toLocaleString(undefined, { minimumFractionDigits: 6, maximumFractionDigits: 6 });

              return (
                <tr
                  key={pair.id}
                  onClick={() => onSelectPair(pair)}
                  className={`group transition-colors cursor-pointer ${
                    darkMode 
                      ? 'hover:bg-slate-800/50 text-slate-200' 
                      : 'hover:bg-blue-50/50 text-slate-900'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-slate-400 font-semibold w-10">
                    {pair.rank}
                  </td>

                  {/* Coin Name & Symbol */}
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2.5 font-sans">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                        {pair.symbol.slice(0, 3)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                          <span>{pair.name}</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-normal uppercase">
                            {pair.symbol}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize hidden sm:inline">
                          {pair.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Price with Live Tick Pulse */}
                  <td className="py-3 px-3 text-right">
                    <div className={`font-bold transition-all duration-300 inline-block px-1.5 py-0.5 rounded ${
                      hasTickUp
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 scale-105'
                        : hasTickDown
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 scale-105'
                          : 'text-slate-900 dark:text-white'
                    }`}>
                      ${formattedPrice}
                    </div>
                  </td>

                  {/* 24h Change */}
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center space-x-0.5 font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      isPositive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isPositive ? '+' : ''}{pair.priceChange24h.toFixed(2)}%</span>
                    </span>
                  </td>

                  {/* 24h Volume */}
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 hidden md:table-cell">
                    {formatNumber(pair.volume24h)}
                  </td>

                  {/* Market Cap */}
                  <td className="py-3 px-3 text-right text-slate-700 dark:text-slate-300 hidden lg:table-cell font-semibold">
                    {formatNumber(pair.marketCap)}
                  </td>

                  {/* Inflow vs Outflow */}
                  <td className="py-3 px-3 hidden xl:table-cell">
                    <div className="w-28 mx-auto">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span className="text-emerald-500">{inflowPct}% In</span>
                        <span className="text-rose-500">{100 - inflowPct}% Out</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-rose-400 overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${inflowPct}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Sparkline */}
                  <td className="py-3 px-3 hidden sm:table-cell text-center">
                    <div className="flex justify-center">
                      {renderSparkline(pair.sparkline, isPositive)}
                    </div>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectPair(pair);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                      title="Analyze Pair & Order Book"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!searchQuery && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <span className="text-slate-500">
            Showing {page === 1 ? '1 – 25' : '26 – 50'} of 50 assets
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(1)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                page === 1
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              1 – 25
            </button>
            <button
              onClick={() => setPage(2)}
              className={`px-3 py-1.5 rounded-lg font-bold border transition-all ${
                page === 2
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              26 – 50
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
