import { CryptoPair, BreakoutNotification } from '../types';
import { INITIAL_TOP_50_PAIRS } from '../data/mockData';
import { soundService } from './soundService';

type MarketListener = (pairs: CryptoPair[]) => void;
type NotificationListener = (notification: BreakoutNotification) => void;

class MarketService {
  private pairs: CryptoPair[] = [...INITIAL_TOP_50_PAIRS];
  private marketListeners: Set<MarketListener> = new Set();
  private notificationListeners: Set<NotificationListener> = new Set();
  private tickInterval: number | null = null;
  private isFetchingRealData: boolean = false;

  constructor() {
    this.initRealMarketData();
    this.startLiveTicks();
  }

  // Fetch real-world live Binance ticker data
  public async initRealMarketData() {
    if (this.isFetchingRealData) return;
    this.isFetchingRealData = true;

    try {
      // Binance 24h ticker public endpoint (CORS-friendly for ticker)
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (res.ok) {
        const binanceTickers: Array<{
          symbol: string;
          lastPrice: string;
          priceChangePercent: string;
          highPrice: string;
          lowPrice: string;
          quoteVolume: string;
        }> = await res.json();

        const tickerMap = new Map<string, typeof binanceTickers[0]>();
        binanceTickers.forEach(t => tickerMap.set(t.symbol, t));

        this.pairs = this.pairs.map(pair => {
          const usdtSymbol = `${pair.symbol}USDT`;
          const binanceData = tickerMap.get(usdtSymbol);
          if (binanceData) {
            const currentPrice = parseFloat(binanceData.lastPrice);
            const change24h = parseFloat(binanceData.priceChangePercent);
            const high = parseFloat(binanceData.highPrice);
            const low = parseFloat(binanceData.lowPrice);
            const vol = parseFloat(binanceData.quoteVolume);

            return {
              ...pair,
              price: currentPrice,
              priceChange24h: change24h,
              high24h: high,
              low24h: low,
              volume24h: vol > 0 ? vol : pair.volume24h,
              lastUpdated: Date.now()
            };
          }
          return pair;
        });

        this.broadcastMarket();
      }
    } catch {
      // Fallback seamlessly to initial realistic state if offline or restricted
    } finally {
      this.isFetchingRealData = false;
    }
  }

  // Realistic high-frequency live market tick generator (0.5s - 2s tick interval)
  private startLiveTicks() {
    if (this.tickInterval) return;

    this.tickInterval = window.setInterval(() => {
      // Pick 2 to 5 random pairs to update on each tick
      const countToUpdate = Math.floor(Math.random() * 4) + 2;
      const updatedPairs = [...this.pairs];
      let hasBreakout = false;

      for (let i = 0; i < countToUpdate; i++) {
        const randomIndex = Math.floor(Math.random() * updatedPairs.length);
        const pair = updatedPairs[randomIndex];
        const prevPrice = pair.price;

        // Micro fluctuation between -0.35% and +0.38% with slight upward bias
        const deltaPct = (Math.random() * 0.7 - 0.33) / 100;
        let newPrice = prevPrice * (1 + deltaPct);

        // Precision format matching asset value
        if (newPrice > 1000) newPrice = Math.round(newPrice * 100) / 100;
        else if (newPrice > 1) newPrice = Math.round(newPrice * 1000) / 1000;
        else newPrice = Math.round(newPrice * 10000000) / 10000000;

        const newChange24h = Math.round((pair.priceChange24h + deltaPct * 10) * 100) / 100;
        const newHigh = Math.max(pair.high24h, newPrice);
        const newLow = Math.min(pair.low24h, newPrice);

        // Update sparkline last point smoothly
        const newSparkline = [...pair.sparkline];
        if (newSparkline.length > 0) {
          newSparkline[newSparkline.length - 1] = newPrice;
        }

        updatedPairs[randomIndex] = {
          ...pair,
          prevPrice,
          price: newPrice,
          priceChange24h: newChange24h,
          high24h: newHigh,
          low24h: newLow,
          sparkline: newSparkline,
          lastUpdated: Date.now()
        };

        // Randomly simulate occasional breakout notifications (1% chance)
        if (Math.random() < 0.012 && !hasBreakout) {
          hasBreakout = true;
          this.triggerSimulatedBreakout(updatedPairs[randomIndex]);
        }
      }

      this.pairs = updatedPairs;
      this.broadcastMarket();
    }, 1400);
  }

  private triggerSimulatedBreakout(pair: CryptoPair) {
    const isPump = Math.random() > 0.3;
    const pctValue = isPump ? (Math.random() * 4 + 3) : -(Math.random() * 3.5 + 2);
    const pct = pctValue.toFixed(1);

    const notification: BreakoutNotification = {
      id: `breakout-${Date.now()}`,
      title: isPump ? `🚀 Breakout Alert: ${pair.symbol}/USDT` : `⚠️ Flash Breakdown: ${pair.symbol}/USDT`,
      message: `${pair.name} (${pair.symbol}) just experienced a ${isPump ? '+' : ''}${pct}% impulse move! Current price: $${pair.price.toLocaleString()}`,
      symbol: pair.symbol,
      timestamp: 'Just now',
      type: 'breakout',
      changePercent: parseFloat(pct),
      price: pair.price,
      read: false
    };

    soundService.playBreakoutAlert();
    this.broadcastNotification(notification);
  }

  public subscribeMarket(listener: MarketListener): () => void {
    this.marketListeners.add(listener);
    listener(this.pairs);
    return () => this.marketListeners.delete(listener);
  }

  public subscribeNotifications(listener: NotificationListener): () => void {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  private broadcastMarket() {
    this.marketListeners.forEach(listener => listener(this.pairs));
  }

  private broadcastNotification(notification: BreakoutNotification) {
    this.notificationListeners.forEach(listener => listener(notification));
  }

  public getPairs(): CryptoPair[] {
    return this.pairs;
  }
}

export const marketService = new MarketService();
