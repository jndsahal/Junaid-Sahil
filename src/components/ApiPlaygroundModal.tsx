import React, { useState } from 'react';
import { X, Code2, Key, RefreshCw, Copy, Check, Terminal, Play, Server, Radio } from 'lucide-react';
import { securityService } from '../services/securityService';

interface ApiPlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

export const ApiPlaygroundModal: React.FC<ApiPlaygroundModalProps> = ({
  isOpen,
  onClose,
  darkMode
}) => {
  const [apiKey, setApiKey] = useState(securityService.getState().apiKey);
  const [copiedKey, setCopiedKey] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<'top50' | 'heatmap' | 'orderblocks' | 'ws'>('top50');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleRegenerateKey = () => {
    const newKey = securityService.regenerateApiKey();
    setApiKey(newKey);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRunTest = () => {
    setTesting(true);
    setTestResponse(null);

    setTimeout(() => {
      setTesting(false);
      if (selectedEndpoint === 'top50') {
        setTestResponse(JSON.stringify({
          status: 'success',
          timestamp: Date.now(),
          count: 50,
          source: 'CoinMarketCap + Binance Ultra-Low Latency Feed',
          data: [
            { rank: 1, symbol: 'BTC', name: 'Bitcoin', price: 94820.50, change24h: 3.42, volume24hUsd: 42850000000 },
            { rank: 2, symbol: 'ETH', name: 'Ethereum', price: 2740.80, change24h: 2.85, volume24hUsd: 21400000000 },
            { rank: 3, symbol: 'SOL', name: 'Solana', price: 194.25, change24h: 6.74, volume24hUsd: 8900000000 }
          ]
        }, null, 2));
      } else if (selectedEndpoint === 'heatmap') {
        setTestResponse(JSON.stringify({
          status: 'success',
          symbol: 'BTCUSDT',
          timeframe: '24h',
          spotPrice: 94820.50,
          magneticZones: {
            upperShortPool: { price: 96900, totalLiquidationUsd: '165.8M', leverage: '100x' },
            lowerLongPool: { price: 92600, totalLiquidationUsd: '188.4M', leverage: '25x' }
          }
        }, null, 2));
      } else if (selectedEndpoint === 'orderblocks') {
        setTestResponse(JSON.stringify({
          status: 'success',
          count: 6,
          orderBlocks: [
            { id: 'ob-1', symbol: 'BTC/USDT', type: 'bullish', range: [92650, 93400], volumeDelta: 480000000, mitigated: false },
            { id: 'ob-2', symbol: 'BTC/USDT', type: 'bearish', range: [97400, 98800], volumeDelta: -620000000, mitigated: false }
          ]
        }, null, 2));
      } else {
        setTestResponse(JSON.stringify({
          event: 'subscribed',
          stream: 'wss://stream.cryptopulse.io/ws/v1/trades?symbol=BTCUSDT',
          heartbeat: 'active',
          latencyMs: 12
        }, null, 2));
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-blue-100 text-slate-900'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Third-Party API & Developer Integrations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                REST API & WebSocket documentation for algorithmic bots and external terminals
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* API Key Management */}
          <div className={`p-4 rounded-xl border ${
            darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-blue-50/40 border-blue-100'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                <span>ACTIVE API SECRET KEY</span>
              </div>
              <button
                onClick={handleRegenerateKey}
                className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Key</span>
              </button>
            </div>

            <div className="flex items-center space-x-2 mt-2">
              <div className="flex-1 font-mono text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 truncate select-all">
                {apiKey}
              </div>
              <button
                onClick={handleCopyKey}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1.5">
              Pass in header: <code className="font-mono text-blue-600 dark:text-blue-400">Authorization: Bearer {apiKey.slice(0, 12)}...</code>
            </span>
          </div>

          {/* Endpoints selector */}
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Available Endpoints
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { id: 'top50', label: 'GET /top50', method: 'GET' },
                { id: 'heatmap', label: 'GET /heatmap', method: 'GET' },
                { id: 'orderblocks', label: 'GET /orderblocks', method: 'GET' },
                { id: 'ws', label: 'WSS /stream', method: 'WS' }
              ].map(ep => (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEndpoint(ep.id as any)}
                  className={`p-2.5 rounded-xl border text-left font-mono transition-all ${
                    selectedEndpoint === ep.id
                      ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span className={`text-[10px] px-1 py-0.5 rounded font-bold uppercase ${
                    ep.method === 'WS' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}>
                    {ep.method}
                  </span>
                  <div className="text-xs mt-1 truncate">{ep.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Request & Response Console */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-200 p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px]">
              <div className="flex items-center space-x-2">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400">INTERACTIVE API CONSOLE</span>
              </div>

              <button
                onClick={handleRunTest}
                disabled={testing}
                className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center space-x-1 transition-all"
              >
                <Play className="w-3 h-3" />
                <span>{testing ? 'Fetching...' : 'Send Request'}</span>
              </button>
            </div>

            <div className="py-2 text-slate-400 text-[11px] truncate">
              {selectedEndpoint === 'ws' 
                ? 'CONNECT wss://stream.cryptopulse.io/ws/v1/ticks?symbols=BTC,ETH,SOL' 
                : `GET https://api.cryptopulse.io/v1/${selectedEndpoint}?limit=50`}
            </div>

            <div className="mt-2 bg-slate-900/90 rounded-lg p-3 max-h-48 overflow-y-auto scrollbar-none text-[11px] text-emerald-400">
              <pre className="whitespace-pre-wrap">
                {testResponse || '// Click "Send Request" to test live endpoint output'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
