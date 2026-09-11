import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Bell, 
  RefreshCw, 
  Sliders, 
  Code2, 
  Sun, 
  Moon, 
  PieChart, 
  Flame, 
  Layers, 
  Lock,
  Search,
  CheckCircle2
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { securityService } from '../services/securityService';
import { BreakoutNotification, UserSecurityState } from '../types';

interface NavbarProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  notifications: BreakoutNotification[];
  onOpenNotifications: () => void;
  onOpenSecurity: () => void;
  onOpenWidgets: () => void;
  onOpenApi: () => void;
  onOpenPortfolio: () => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  activeView: 'dashboard' | 'heatmap' | 'orderblocks' | 'portfolio';
  setActiveView: (view: 'dashboard' | 'heatmap' | 'orderblocks' | 'portfolio') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  darkMode,
  onToggleDarkMode,
  soundEnabled,
  onToggleSound,
  notifications,
  onOpenNotifications,
  onOpenSecurity,
  onOpenWidgets,
  onOpenApi,
  onOpenPortfolio,
  onSearchChange,
  searchQuery,
  activeView,
  setActiveView
}) => {
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [securityState, setSecurityState] = useState<UserSecurityState>(securityService.getState());

  useEffect(() => {
    const updateSecurity = () => setSecurityState(securityService.getState());
    window.addEventListener('storage', updateSecurity);
    return () => window.removeEventListener('storage', updateSecurity);
  }, []);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncStatus('Syncing...');
    await securityService.triggerCloudSync();
    setSyncing(false);
    setSyncStatus('Cloud Synced');
    setTimeout(() => setSyncStatus('Synced'), 3000);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className={`sticky top-0 z-40 transition-colors border-b ${
      darkMode 
        ? 'bg-[#0B1120]/95 border-slate-800 text-slate-100 backdrop-blur-md' 
        : 'bg-white/95 border-blue-100 text-slate-900 backdrop-blur-md'
    }`}>
      {/* Top Micro Ticker Stats */}
      <div className={`px-4 py-1 text-xs border-b flex items-center justify-between font-mono overflow-x-auto scrollbar-none ${
        darkMode ? 'bg-slate-950/60 border-slate-800/80 text-slate-400' : 'bg-blue-50/70 border-blue-100 text-slate-600'
      }`}>
        <div className="flex items-center space-x-5 min-w-max">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-blue-600 dark:text-blue-400">MARKET LIVE</span>
          </div>
          <div>
            Total Cap: <span className="font-semibold text-slate-800 dark:text-slate-200">$3.41T</span> 
            <span className="text-emerald-500 ml-1 font-medium">(+3.15%)</span>
          </div>
          <div>
            24h Vol: <span className="font-semibold text-slate-800 dark:text-slate-200">$148.5B</span>
          </div>
          <div>
            BTC Dominance: <span className="font-semibold text-blue-600 dark:text-blue-400">57.8%</span>
          </div>
          <div>
            24h Liq: <span className="text-rose-500 font-semibold">$318.5M</span>
          </div>
          <div>
            Gas: <span className="font-semibold text-slate-800 dark:text-slate-200">14 Gwei</span>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-3 text-[11px]">
          <span className="flex items-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Binance & CoinGlass Feeds: Ultra-Low Latency
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={() => setActiveView('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                  CryptoPulse
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                  PRO
                </span>
              </div>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 tracking-wide">
                Institutional Terminal
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Top 50 Terminal</span>
            </button>

            <button
              onClick={() => setActiveView('heatmap')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeView === 'heatmap'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Liquidity Heatmap</span>
            </button>

            <button
              onClick={() => setActiveView('orderblocks')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeView === 'orderblocks'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Order Blocks (SMC)</span>
            </button>

            <button
              onClick={() => setActiveView('portfolio')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeView === 'portfolio'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-500" />
              <span>Portfolio Tracker</span>
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="hidden sm:flex items-center flex-1 max-w-xs relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search coin (BTC, SOL, SUI...)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              darkMode
                ? 'bg-slate-900/90 border-slate-700 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50/80 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Right Actions & Utilities */}
        <div className="flex items-center space-x-2">
          {/* Cloud Sync Status */}
          <button
            onClick={handleManualSync}
            title="Cloud Data Sync across all devices"
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
              darkMode 
                ? 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-blue-500' 
                : 'bg-blue-50/60 border-blue-200/80 text-blue-800 hover:bg-blue-100/70'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-500' : 'text-blue-600 dark:text-blue-400'}`} />
            <span className="hidden sm:inline font-mono">{syncStatus}</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Breakout Sound Alerts: Active' : 'Sound Muted'}
            className={`p-2 rounded-lg border transition-colors ${
              soundEnabled
                ? 'text-blue-600 border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-400'
                : 'text-slate-400 border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Real-time Push Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            title="Real-time Breakout Notifications"
            className={`p-2 rounded-lg border relative transition-colors ${
              unreadCount > 0
                ? 'border-blue-300 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                : 'border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Security & MFA / Biometric Button */}
          <button
            onClick={onOpenSecurity}
            title="Security Center (MFA & Biometric Authentication)"
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors ${
              securityState.biometricEnabled && securityState.mfaEnabled
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">MFA / Bio</span>
          </button>

          {/* API Integrations */}
          <button
            onClick={onOpenApi}
            title="API Keys & Developer Integrations"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* Customize Widgets */}
          <button
            onClick={onOpenWidgets}
            title="Customize Widgets & Layout"
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            title={darkMode ? 'Switch to White & Blue Light Theme' : 'Switch to Dark Mode for Late-Night Trading'}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700'
                : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t px-2 py-2 text-xs font-semibold overflow-x-auto scrollbar-none border-inherit">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-3 py-1 rounded-md ${activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Top 50
        </button>
        <button
          onClick={() => setActiveView('heatmap')}
          className={`px-3 py-1 rounded-md ${activeView === 'heatmap' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Liquidity Map
        </button>
        <button
          onClick={() => setActiveView('orderblocks')}
          className={`px-3 py-1 rounded-md ${activeView === 'orderblocks' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Order Blocks
        </button>
        <button
          onClick={() => setActiveView('portfolio')}
          className={`px-3 py-1 rounded-md ${activeView === 'portfolio' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'}`}
        >
          Portfolio
        </button>
      </div>
    </header>
  );
};
