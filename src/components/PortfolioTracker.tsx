import React, { useState } from 'react';
import { 
  PieChart, 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Bell, 
  Trash2, 
  Target, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { INITIAL_PORTFOLIO, INITIAL_ALERTS } from '../data/mockData';
import { PortfolioAsset, CryptoPair, CustomAlert } from '../types';

interface PortfolioTrackerProps {
  pairs: CryptoPair[];
  darkMode: boolean;
  onOpenAddAsset: () => void;
  onOpenAddAlert: () => void;
}

export const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({
  pairs,
  darkMode,
  onOpenAddAsset,
  onOpenAddAlert
}) => {
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>(INITIAL_PORTFOLIO);
  const [alerts, setAlerts] = useState<CustomAlert[]>(INITIAL_ALERTS);

  // Map latest live price for each symbol
  const priceMap = new Map<string, number>();
  pairs.forEach(p => priceMap.set(p.symbol, p.price));

  // Compute portfolio valuation
  let totalCurrentValue = 0;
  let totalCostBasis = 0;

  const holdingsWithMetrics = portfolio.map(asset => {
    const currentPrice = priceMap.get(asset.symbol) || asset.buyPrice;
    const currentValue = asset.amount * currentPrice;
    const costBasis = asset.amount * asset.buyPrice;
    const pnlUsd = currentValue - costBasis;
    const pnlPercent = costBasis > 0 ? (pnlUsd / costBasis) * 100 : 0;

    totalCurrentValue += currentValue;
    totalCostBasis += costBasis;

    return {
      ...asset,
      currentPrice,
      currentValue,
      costBasis,
      pnlUsd,
      pnlPercent
    };
  });

  const totalAllTimePnlUsd = totalCurrentValue - totalCostBasis;
  const totalAllTimePnlPct = totalCostBasis > 0 ? (totalAllTimePnlUsd / totalCostBasis) * 100 : 0;

  const handleDeleteAsset = (id: string) => {
    setPortfolio(prev => prev.filter(a => a.id !== id));
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all mb-6 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Portfolio Tracker & Advanced Analytics
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                Live Valuation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time PnL performance, asset allocation, target triggers and risk analysis
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenAddAlert}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              darkMode 
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:border-blue-500' 
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-blue-500" />
            <span>Set Price Alert</span>
          </button>

          <button
            onClick={onOpenAddAsset}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-blue-600/30 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-5">
        {/* Total Balance */}
        <div className={`p-4 rounded-xl border font-mono ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-blue-50/50 border-blue-100'
        }`}>
          <span className="text-xs text-slate-500 block font-sans font-medium mb-1">
            Total Net Worth
          </span>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-1">
            Cost Basis: ${totalCostBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* All-Time PnL */}
        <div className={`p-4 rounded-xl border font-mono ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-emerald-50/40 border-emerald-100'
        }`}>
          <span className="text-xs text-slate-500 block font-sans font-medium mb-1">
            All-Time Profit / Loss
          </span>
          <div className={`text-2xl font-black tracking-tight ${totalAllTimePnlUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {totalAllTimePnlUsd >= 0 ? '+' : ''}${totalAllTimePnlUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <span className={`text-[11px] font-bold block mt-1 ${totalAllTimePnlPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
            {totalAllTimePnlPct >= 0 ? '+' : ''}{totalAllTimePnlPct.toFixed(2)}% Overall Return
          </span>
        </div>

        {/* 24h Performance */}
        <div className={`p-4 rounded-xl border font-mono ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <span className="text-xs text-slate-500 block font-sans font-medium mb-1">
            24h Estimated Delta
          </span>
          <div className="text-2xl font-black text-emerald-500 tracking-tight">
            +$4,820.40
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
            +2.84% past 24 hours
          </span>
        </div>

        {/* Portfolio Health & Sharpe Ratio */}
        <div className={`p-4 rounded-xl border font-mono ${
          darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200/80'
        }`}>
          <span className="text-xs text-slate-500 block font-sans font-medium mb-1">
            Risk-Adjusted Alpha
          </span>
          <div className="text-2xl font-black text-indigo-500 tracking-tight">
            2.41 Sharpe
          </div>
          <span className="text-[11px] text-slate-400 font-sans block mt-1">
            Max Drawdown: -14.2% (Low Risk)
          </span>
        </div>
      </div>

      {/* Allocation Progress Bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center text-xs font-semibold mb-2">
          <span className="text-slate-500">Asset Allocation Breakdown</span>
          <span className="text-slate-400 font-mono">{holdingsWithMetrics.length} Active Holdings</span>
        </div>

        <div className="w-full h-3 rounded-md overflow-hidden flex bg-slate-100 dark:bg-slate-800 font-mono">
          {holdingsWithMetrics.map((asset, i) => {
            const pct = totalCurrentValue > 0 ? (asset.currentValue / totalCurrentValue) * 100 : 0;
            const colors = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
            const color = colors[i % colors.length];

            return (
              <div
                key={asset.id}
                className={`h-full ${color} transition-all`}
                style={{ width: `${pct}%` }}
                title={`${asset.symbol}: ${pct.toFixed(1)}%`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs mt-2 font-mono">
          {holdingsWithMetrics.map((asset, i) => {
            const pct = totalCurrentValue > 0 ? (asset.currentValue / totalCurrentValue) * 100 : 0;
            const colors = ['bg-blue-600', 'bg-indigo-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500'];
            const color = colors[i % colors.length];

            return (
              <div key={asset.id} className="flex items-center space-x-1.5">
                <span className={`w-2.5 h-2.5 rounded-xs ${color}`}></span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{asset.symbol}</span>
                <span className="text-slate-400">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Holdings Table */}
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
              darkMode ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500 bg-slate-50/50'
            }`}>
              <th className="py-2.5 px-3">Asset</th>
              <th className="py-2.5 px-3 text-right">Holdings</th>
              <th className="py-2.5 px-3 text-right">Avg Buy Price</th>
              <th className="py-2.5 px-3 text-right">Live Price</th>
              <th className="py-2.5 px-3 text-right">Total Value</th>
              <th className="py-2.5 px-3 text-right">Unrealized PnL</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
            {holdingsWithMetrics.map((asset) => {
              const isProfit = asset.pnlUsd >= 0;

              return (
                <tr 
                  key={asset.id}
                  className={`transition-colors ${darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-blue-50/40'}`}
                >
                  <td className="py-3 px-3 font-sans">
                    <div className="flex items-center space-x-2">
                      <span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                        {asset.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">{asset.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono uppercase">{asset.symbol}</span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    {asset.amount.toLocaleString()} {asset.symbol}
                  </td>

                  <td className="py-3 px-3 text-right text-slate-500">
                    ${asset.buyPrice.toLocaleString()}
                  </td>

                  <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-white">
                    ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white">
                    ${asset.currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center space-x-1 font-bold ${
                      isProfit ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isProfit ? '+' : ''}${asset.pnlUsd.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ({isProfit ? '+' : ''}{asset.pnlPercent.toFixed(1)}%)</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Remove Holding"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Active Custom Price Alerts Section */}
      <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-500" />
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Custom Price Alerts & Breakout Triggers ({alerts.length})
            </h4>
          </div>
          <button
            onClick={onOpenAddAlert}
            className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
          >
            + New Alert
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-3 rounded-xl border flex items-center justify-between font-mono text-xs ${
                darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center space-x-1.5 font-bold text-slate-900 dark:text-white">
                  <span>{al.symbol}</span>
                  <span className={al.condition === 'above' ? 'text-emerald-500' : 'text-rose-500'}>
                    {al.condition === 'above' ? '≥' : '≤'} ${al.targetPrice.toLocaleString()}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">
                  {al.note}
                </span>
              </div>
              <button
                onClick={() => handleDeleteAlert(al.id)}
                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
