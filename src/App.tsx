import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LiveTickerTape } from './components/LiveTickerTape';
import { MarketOverview } from './components/MarketOverview';
import { LiquidityHeatmap } from './components/LiquidityHeatmap';
import { OrderBlocksWidget } from './components/OrderBlocksWidget';
import { Top50Table } from './components/Top50Table';
import { NetFlowWhaleRadar } from './components/NetFlowWhaleRadar';
import { PortfolioTracker } from './components/PortfolioTracker';
import { SecurityModal } from './components/SecurityModal';
import { ApiPlaygroundModal } from './components/ApiPlaygroundModal';
import { CustomWidgetsModal } from './components/CustomWidgetsModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AddAssetModal } from './components/AddAssetModal';
import { AddAlertModal } from './components/AddAlertModal';
import { PairDetailModal } from './components/PairDetailModal';
import { MobileBottomNav } from './components/MobileBottomNav';

import { marketService } from './services/marketService';
import { soundService } from './services/soundService';
import { securityService } from './services/securityService';
import { 
  CryptoPair, 
  MarketIndexData, 
  BreakoutNotification, 
  WidgetConfig, 
  PortfolioAsset, 
  CustomAlert 
} from './types';
import { 
  INITIAL_TOP_50_PAIRS, 
  INITIAL_MARKET_INDEX, 
  INITIAL_NOTIFICATIONS, 
  DEFAULT_WIDGETS,
  INITIAL_PORTFOLIO,
  INITIAL_ALERTS
} from './data/mockData';
import { Sparkles, Bell, X, ArrowUpRight } from 'lucide-react';

export default function App() {
  // Theme state: default false = White & Blue theme as requested; true = Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cryptopulse_theme') === 'dark';
    }
    return false;
  });

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Active navigation view
  const [activeView, setActiveView] = useState<'dashboard' | 'heatmap' | 'orderblocks' | 'portfolio'>('dashboard');

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Market pairs state (subscribed to live ticker service)
  const [pairs, setPairs] = useState<CryptoPair[]>(INITIAL_TOP_50_PAIRS);
  const [marketIndex, setMarketIndex] = useState<MarketIndexData>(INITIAL_MARKET_INDEX);

  // Notifications
  const [notifications, setNotifications] = useState<BreakoutNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeToast, setActiveToast] = useState<BreakoutNotification | null>(null);

  // Widgets configuration
  const [widgets, setWidgets] = useState<WidgetConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cryptopulse_widgets');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return DEFAULT_WIDGETS;
  });

  // Modals state
  const [selectedPairModal, setSelectedPairModal] = useState<CryptoPair | null>(null);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [isWidgetsModalOpen, setIsWidgetsModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState<boolean>(false);
  const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState<boolean>(false);

  // Subscribe to live market ticks and notifications
  useEffect(() => {
    const unsubMarket = marketService.subscribeMarket((updatedPairs) => {
      setPairs(updatedPairs);
    });

    const unsubNotifs = marketService.subscribeNotifications((notif) => {
      setNotifications(prev => [notif, ...prev]);
      setActiveToast(notif);
      setTimeout(() => {
        setActiveToast(current => (current?.id === notif.id ? null : current));
      }, 5000);
    });

    return () => {
      unsubMarket();
      unsubNotifs();
    };
  }, []);

  // Sync theme class to document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cryptopulse_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cryptopulse_theme', 'light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundService.setSoundEnabled(next);
  };

  const handleToggleWidget = (id: string) => {
    const updated = widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
    setWidgets(updated);
    localStorage.setItem('cryptopulse_widgets', JSON.stringify(updated));
  };

  const handleResetWidgets = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.setItem('cryptopulse_widgets', JSON.stringify(DEFAULT_WIDGETS));
  };

  const handleAddAsset = (asset: PortfolioAsset) => {
    soundService.playAuthSuccess();
  };

  const handleAddAlert = (alert: CustomAlert) => {
    soundService.playAuthSuccess();
  };

  const isWidgetEnabled = (id: string) => {
    return widgets.find(w => w.id === id)?.enabled ?? true;
  };

  // Find BTC pair for spot price reference
  const btcPair = pairs.find(p => p.symbol === 'BTC') || pairs[0];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      darkMode ? 'bg-[#0B1120] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
    }`}>
      {/* Navigation Header */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        onOpenWidgets={() => setIsWidgetsModalOpen(true)}
        onOpenApi={() => setIsApiModalOpen(true)}
        onOpenPortfolio={() => setActiveView('portfolio')}
        onSearchChange={setSearchQuery}
        searchQuery={searchQuery}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* Real-time Ticker Ribbon */}
      <LiveTickerTape
        pairs={pairs}
        onSelectPair={setSelectedPairModal}
        darkMode={darkMode}
      />

      {/* Main Trading Terminal Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        {/* Dynamic View Routing */}

        {/* 1. Dashboard View */}
        {activeView === 'dashboard' && (
          <div>
            {isWidgetEnabled('market-indices') && (
              <MarketOverview
                marketIndex={marketIndex}
                darkMode={darkMode}
              />
            )}

            {isWidgetEnabled('liquidity-heatmap') && (
              <LiquidityHeatmap
                currentBtcPrice={btcPair.price}
                darkMode={darkMode}
              />
            )}

            {isWidgetEnabled('top-50-table') && (
              <Top50Table
                pairs={pairs}
                onSelectPair={setSelectedPairModal}
                darkMode={darkMode}
                searchQuery={searchQuery}
              />
            )}

            {isWidgetEnabled('order-blocks') && (
              <OrderBlocksWidget
                darkMode={darkMode}
                onSelectPair={(sym) => {
                  const found = pairs.find(p => p.symbol === sym);
                  if (found) setSelectedPairModal(found);
                }}
              />
            )}

            {isWidgetEnabled('net-flows') && (
              <NetFlowWhaleRadar
                darkMode={darkMode}
              />
            )}

            {isWidgetEnabled('portfolio-summary') && (
              <PortfolioTracker
                pairs={pairs}
                darkMode={darkMode}
                onOpenAddAsset={() => setIsAddAssetModalOpen(true)}
                onOpenAddAlert={() => setIsAddAlertModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* 2. Standalone Liquidity Heatmap View */}
        {activeView === 'heatmap' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                CoinGlass Liquidity Heatmap & Depth Explorer
              </h2>
              <p className="text-xs text-slate-500">
                Institutional-grade liquidation leverage mapping with magnetic attraction pools
              </p>
            </div>
            <LiquidityHeatmap
              currentBtcPrice={btcPair.price}
              darkMode={darkMode}
            />
            <OrderBlocksWidget
              darkMode={darkMode}
              onSelectPair={(sym) => {
                const found = pairs.find(p => p.symbol === sym);
                if (found) setSelectedPairModal(found);
              }}
            />
          </div>
        )}

        {/* 3. Standalone Order Blocks (SMC) View */}
        {activeView === 'orderblocks' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Smart Money Concepts & Institutional Order Blocks
              </h2>
              <p className="text-xs text-slate-500">
                Bullish and Bearish order blocks, fair value gaps, and liquidity sweeps across timeframes
              </p>
            </div>
            <OrderBlocksWidget
              darkMode={darkMode}
              onSelectPair={(sym) => {
                const found = pairs.find(p => p.symbol === sym);
                if (found) setSelectedPairModal(found);
              }}
            />
            <LiquidityHeatmap
              currentBtcPrice={btcPair.price}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* 4. Standalone Portfolio View */}
        {activeView === 'portfolio' && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Portfolio Tracker & Real-Time Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Live asset valuation synced with real-time market ticks, custom alerts and risk metrics
              </p>
            </div>
            <PortfolioTracker
              pairs={pairs}
              darkMode={darkMode}
              onOpenAddAsset={() => setIsAddAssetModalOpen(true)}
              onOpenAddAlert={() => setIsAddAlertModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Floating Push Notification Toast */}
      {activeToast && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start justify-between space-x-3 ${
            darkMode 
              ? 'bg-slate-900/95 border-blue-500/80 text-white' 
              : 'bg-white/95 border-blue-200 text-slate-900 shadow-blue-500/10'
          }`}>
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-blue-600 text-white mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs">{activeToast.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Now</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {activeToast.message}
                </p>
                <button
                  onClick={() => {
                    const found = pairs.find(p => p.symbol === activeToast.symbol);
                    if (found) setSelectedPairModal(found);
                    setActiveToast(null);
                  }}
                  className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-1 hover:underline"
                >
                  <span>Inspect Pair & Depth</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setActiveToast(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cross-Platform Bottom Dock */}
      <MobileBottomNav
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        darkMode={darkMode}
      />

      {/* Modals */}
      <PairDetailModal
        pair={selectedPairModal}
        onClose={() => setSelectedPairModal(null)}
        darkMode={darkMode}
      />

      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        darkMode={darkMode}
      />

      <ApiPlaygroundModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        darkMode={darkMode}
      />

      <CustomWidgetsModal
        isOpen={isWidgetsModalOpen}
        onClose={() => setIsWidgetsModalOpen(false)}
        widgets={widgets}
        onToggleWidget={handleToggleWidget}
        onResetWidgets={handleResetWidgets}
        darkMode={darkMode}
      />

      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onClearNotifications={() => setNotifications([])}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        darkMode={darkMode}
      />

      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        pairs={pairs}
        onAddAsset={handleAddAsset}
        darkMode={darkMode}
      />

      <AddAlertModal
        isOpen={isAddAlertModalOpen}
        onClose={() => setIsAddAlertModalOpen(false)}
        pairs={pairs}
        onAddAlert={handleAddAlert}
        darkMode={darkMode}
      />
    </div>
  );
}
