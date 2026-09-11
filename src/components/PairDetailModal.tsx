import React, { useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  BarChart2, 
  Layers, 
  Activity, 
  Flame, 
  ArrowUp, 
  ArrowDown,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { CryptoPair } from '../types';

interface PairDetailModalProps {
  pair: CryptoPair | null;
  onClose: () => void;
  darkMode: boolean;
}

export const PairDetailModal: React.FC<PairDetailModalProps> = ({
  pair,
  onClose,
  darkMode
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'orderbook' | 'trades'>('chart');
  const [chartTf, setChartTf] = useState<'1H' | '24H' | '7D' | '30D'>('24H');

  if (!pair) return null;

  const isPositive = pair.priceChange24h >= 0;

  // Generate simulated order book ladder based on pair price
  const generateOrderBook = () => {
    const spreadPct = 0.0004; // 0.04%
    const stepPct = 0.0012;

    const asks = [];
    for (let i = 5; i >= 1; i--) {
      const price = pair.price * (1 + spreadPct + i * stepPct);
      const amount = (pair.price > 1000 ? Math.random() * 4 + 1 : Math.random() * 400 + 50);
      const totalUsd = price * amount;
      asks.push({ price, amount, totalUsd });
    }

    const bids = [];
    for (let i = 1; i <= 5; i++) {
      const price = pair.price * (1 - spreadPct - i * stepPct);
      const amount = (pair.price > 1000 ? Math.random() * 4 + 1 : Math.random() * 400 + 50);
      const totalUsd = price * amount;
      bids.push({ price, amount, totalUsd });
    }

    return { asks, bids };
  };

  const { asks, bids } = generateOrderBook();

  // Synthetic trades
  const recentTrades = [
    { time: '14:24:02', price: pair.price, amount: (pair.price > 1000 ? 0.42 : 120), side: 'buy' },
    { time: '14:23:58', price: pair.price * 0.9998, amount: (pair.price > 1000 ? 1.15 : 450), side: 'sell' },
    { time: '14:23:55', price: pair.price * 1.0002, amount: (pair.price > 1000 ? 2.80 : 800), side: 'buy' },
    { time: '14:23:49', price: pair.price * 1.0001, amount: (pair.price > 1000 ? 0.85 : 300), side: 'buy' },
    { time: '14:23:41', price: pair.price * 0.9995, amount: (pair.price > 1000 ? 3.40 : 1100), side: 'sell' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-3xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {pair.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black">{pair.name}</h3>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  {pair.symbol}/USDT
                </span>
                <span className="text-xs text-slate-400 font-semibold">Rank #{pair.rank}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs font-mono mt-0.5">
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  ${pair.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </span>
                <span className={`font-bold flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {isPositive ? '+' : ''}{pair.priceChange24h.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Key Metrics Strip */}
        <div className={`px-6 py-3 border-b grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono ${
          darkMode ? 'bg-slate-950/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-600'
        }`}>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">24h High / Low</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ${pair.high24h.toLocaleString()} / ${pair.low24h.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">24h Turnover</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              ${(pair.volume24h / 1e9).toFixed(2)}B
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Funding Rate</span>
            <span className="font-bold text-emerald-500">
              +{(pair.fundingRate * 100).toFixed(4)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Liquidity Score</span>
            <span className="font-bold text-blue-500">
              {pair.liquidityScore} / 100
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('chart')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'chart'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Interactive Price Chart
            </button>
            <button
              onClick={() => setActiveTab('orderbook')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'orderbook'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Live Order Book Ladder
            </button>
            <button
              onClick={() => setActiveTab('trades')}
              className={`pb-2.5 border-b-2 transition-all ${
                activeTab === 'trades'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Recent Real-Time Trades
            </button>
          </div>

          {activeTab === 'chart' && (
            <div className="flex items-center space-x-1 text-xs font-mono pb-2">
              {(['1H', '24H', '7D', '30D'] as const).map(tf => (
                <button
                  key={tf}
                  onClick={() => setChartTf(tf)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    chartTf === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-blue-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'chart' && (
            <div>
              <div className="h-56 w-full relative flex items-center justify-center rounded-xl bg-slate-950 p-4 overflow-hidden">
                {/* SVG Area Chart */}
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
                  <defs>
                    <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="500" y2="40" stroke="#1E293B" strokeDasharray="3 3" />
                  <line x1="0" y1="80" x2="500" y2="80" stroke="#1E293B" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#1E293B" strokeDasharray="3 3" />

                  {/* Area Fill */}
                  <polygon
                    points="0,160 0,130 70,115 140,125 210,95 280,105 350,60 420,45 500,30 500,160"
                    fill="url(#chartGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points="0,130 70,115 140,125 210,95 280,105 350,60 420,45 500,30"
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* End pulse circle */}
                  <circle cx="500" cy="30" r="5" fill="#3B82F6" className="animate-ping" />
                  <circle cx="500" cy="30" r="4" fill="#60A5FA" />
                </svg>

                <div className="absolute top-3 left-4 text-xs font-mono text-slate-400">
                  High: ${(pair.high24h).toLocaleString()}
                </div>
                <div className="absolute bottom-3 left-4 text-xs font-mono text-slate-500">
                  Low: ${(pair.low24h).toLocaleString()}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orderbook' && (
            <div className="grid grid-cols-2 gap-4 font-mono text-xs">
              {/* Asks (Sell) */}
              <div>
                <span className="text-rose-500 font-bold block mb-2">Asks (Sell Depth)</span>
                <div className="space-y-1">
                  {asks.map((ask, i) => (
                    <div key={i} className="flex justify-between items-center px-2 py-1 rounded bg-rose-950/20 text-rose-300">
                      <span>${ask.price.toFixed(2)}</span>
                      <span className="text-slate-400">{ask.amount.toFixed(2)}</span>
                      <span className="font-bold">${(ask.totalUsd / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bids (Buy) */}
              <div>
                <span className="text-emerald-500 font-bold block mb-2">Bids (Buy Depth)</span>
                <div className="space-y-1">
                  {bids.map((bid, i) => (
                    <div key={i} className="flex justify-between items-center px-2 py-1 rounded bg-emerald-950/20 text-emerald-300">
                      <span>${bid.price.toFixed(2)}</span>
                      <span className="text-slate-400">{bid.amount.toFixed(2)}</span>
                      <span className="font-bold">${(bid.totalUsd / 1000).toFixed(0)}k</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="font-mono text-xs space-y-1.5">
              <div className="flex justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>Timestamp</span>
                <span>Price</span>
                <span>Amount</span>
                <span>Side</span>
              </div>
              {recentTrades.map((t, i) => (
                <div key={i} className="flex justify-between items-center py-1">
                  <span className="text-slate-500">{t.time}</span>
                  <span className="font-bold text-slate-900 dark:text-white">${t.price.toFixed(2)}</span>
                  <span className="text-slate-400">{t.amount.toFixed(2)} {pair.symbol}</span>
                  <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
                    t.side === 'buy' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {t.side}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
