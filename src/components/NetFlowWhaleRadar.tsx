import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, Radio, ExternalLink, ShieldCheck, Wallet, ArrowRightLeft } from 'lucide-react';
import { INITIAL_EXCHANGE_NET_FLOWS, INITIAL_WHALE_ALERTS } from '../data/mockData';
import { ExchangeNetFlow, WhaleAlert } from '../types';

interface NetFlowWhaleRadarProps {
  darkMode: boolean;
}

export const NetFlowWhaleRadar: React.FC<NetFlowWhaleRadarProps> = ({ darkMode }) => {
  const [exchangeFlows, setExchangeFlows] = useState<ExchangeNetFlow[]>(INITIAL_EXCHANGE_NET_FLOWS);
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>(INITIAL_WHALE_ALERTS);

  // Periodically add a new simulated whale alert to keep the live terminal dynamic
  useEffect(() => {
    const interval = setInterval(() => {
      const symbols = ['BTC', 'ETH', 'SOL', 'USDT'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const isOutflow = Math.random() > 0.45;
      const amount = sym === 'BTC' ? Math.floor(Math.random() * 800 + 300)
        : sym === 'ETH' ? Math.floor(Math.random() * 12000 + 4000)
        : sym === 'SOL' ? Math.floor(Math.random() * 150000 + 50000)
        : Math.floor(Math.random() * 50000000 + 20000000);

      const usdVal = sym === 'BTC' ? amount * 94800
        : sym === 'ETH' ? amount * 2740
        : sym === 'SOL' ? amount * 194
        : amount;

      const newAlert: WhaleAlert = {
        id: `whale-${Date.now()}`,
        timestamp: 'Just now',
        symbol: sym,
        amount,
        usdValue: usdVal,
        from: isOutflow ? 'Binance Hot Wallet' : 'Unknown Whale 0x9f...4a',
        to: isOutflow ? 'Institutional Cold Custody' : 'Coinbase Prime OTC',
        type: isOutflow ? 'outflow' : 'inflow',
        hash: `${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`
      };

      setWhaleAlerts(prev => [newAlert, ...prev.slice(0, 7)]);
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  const totalInflows = exchangeFlows.reduce((acc, f) => acc + f.inflowUsd, 0);
  const totalOutflows = exchangeFlows.reduce((acc, f) => acc + f.outflowUsd, 0);
  const netMarketFlow = totalInflows - totalOutflows;

  return (
    <div className={`p-5 rounded-2xl border transition-all mb-6 ${
      darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-blue-100 shadow-sm'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Exchange Inflow vs Outflow & Whale Radar
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                On-Chain Flows
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tracking institutional exchange net deposits, withdrawals, and large OTC movements
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-500">Net 24h Flow:</span>
          <span className={`font-black text-sm ${netMarketFlow >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {netMarketFlow >= 0 ? '+' : ''}${(netMarketFlow / 1000000).toFixed(1)}M Net Accumulation
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* Left Column: Exchange Inflow vs Outflow Bars */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Major Exchange 24h Flow Balance
          </h4>
          <div className="space-y-3 font-mono">
            {exchangeFlows.map((flow) => {
              const total = flow.inflowUsd + flow.outflowUsd;
              const inPct = Math.round((flow.inflowUsd / total) * 100);
              const outPct = 100 - inPct;

              return (
                <div 
                  key={flow.exchange}
                  className={`p-3 rounded-xl border ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/70 border-slate-200/80'
                  }`}
                >
                  <div className="flex justify-between items-center text-xs mb-1.5 font-sans">
                    <span className="font-bold text-slate-900 dark:text-white">{flow.exchange}</span>
                    <span className="text-[11px] text-slate-500">{flow.dominantAsset}</span>
                  </div>

                  {/* Flow comparison bar */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800 mb-1.5">
                    <div 
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${inPct}%` }}
                      title={`Inflow: $${(flow.inflowUsd / 1000000).toFixed(0)}M`}
                    />
                    <div 
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${outPct}%` }}
                      title={`Outflow: $${(flow.outflowUsd / 1000000).toFixed(0)}M`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px]">
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowDownLeft className="w-3 h-3 mr-0.5" />
                      In: ${(flow.inflowUsd / 1000000).toFixed(0)}M ({inPct}%)
                    </span>
                    <span className={`font-bold ${flow.netFlowUsd >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      Net: {flow.netFlowUsd >= 0 ? '+' : ''}${(flow.netFlowUsd / 1000000).toFixed(0)}M
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 flex items-center">
                      <ArrowUpRight className="w-3 h-3 mr-0.5" />
                      Out: ${(flow.outflowUsd / 1000000).toFixed(0)}M ({outPct}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Live Whale Movement Feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Live Whale Alert Stream
            </h4>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping mr-1"></span>
              Broadcasting
            </span>
          </div>

          <div className="space-y-2 max-h-[360px] overflow-y-auto scrollbar-none font-mono">
            {whaleAlerts.map((whale) => {
              const isOutflow = whale.type === 'outflow';

              return (
                <div
                  key={whale.id}
                  className={`p-2.5 rounded-xl border transition-all text-xs ${
                    darkMode 
                      ? 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700' 
                      : 'bg-slate-50/80 border-slate-200/80 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`p-1 rounded-md ${
                        isOutflow ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {isOutflow ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                      </span>
                      <span className="font-extrabold text-slate-900 dark:text-white">
                        {whale.amount.toLocaleString()} {whale.symbol}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        (${((whale.usdValue) / 1000000).toFixed(1)}M)
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">
                      {whale.timestamp}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60 font-sans">
                    <div className="truncate max-w-[200px]" title={`${whale.from} -> ${whale.to}`}>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{whale.from}</span>
                      <span className="mx-1 text-slate-400">→</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{whale.to}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      tx: {whale.hash}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
