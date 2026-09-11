export type MarketCategory = 'all' | 'layer1' | 'defi' | 'ai' | 'meme' | 'l2';

export interface CryptoPair {
  id: string;
  rank: number;
  symbol: string;
  name: string;
  price: number;
  prevPrice?: number;
  priceChange24h: number;
  priceChange7d: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  sparkline: number[];
  category: MarketCategory;
  inflow24h: number;
  outflow24h: number;
  openInterest: number;
  fundingRate: number; // e.g. 0.012%
  liquidityScore: number; // 0 - 100
  lastUpdated: number;
}

export interface LiquidityLevel {
  price: number;
  volumeUsd: number; // Millions USD
  leverage: 10 | 25 | 50 | 100;
  type: 'long' | 'short';
  heatIntensity: number; // 0 - 1 (color heat)
  liquidationsCount: number;
  distancePct: number;
}

export interface OrderBlock {
  id: string;
  symbol: string;
  type: 'bullish' | 'bearish' | 'breaker';
  timeframe: '15m' | '1h' | '4h' | '1D';
  highPrice: number;
  lowPrice: number;
  mitigated: boolean;
  volumeDeltaUsd: number;
  strength: 'High' | 'Medium' | 'Extreme';
  timestamp: string;
  description: string;
}

export interface WhaleAlert {
  id: string;
  timestamp: string;
  symbol: string;
  amount: number;
  usdValue: number;
  from: string;
  to: string;
  type: 'inflow' | 'outflow' | 'transfer';
  hash: string;
}

export interface ExchangeNetFlow {
  exchange: string;
  inflowUsd: number;
  outflowUsd: number;
  netFlowUsd: number;
  dominantAsset: string;
}

export interface MarketIndexData {
  fearGreedIndex: number;
  fearGreedSentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  altcoinSeasonIndex: number;
  btcDominance: number;
  ethDominance: number;
  totalMarketCap: number;
  marketCapChange24h: number;
  totalVolume24h: number;
  liquidations24h: {
    total: number;
    longs: number;
    shorts: number;
  };
}

export interface PortfolioAsset {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  buyPrice: number;
  buyDate: string;
  notes?: string;
}

export interface CustomAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  createdAt: string;
  triggered: boolean;
  triggeredAt?: string;
  note: string;
}

export interface BreakoutNotification {
  id: string;
  title: string;
  message: string;
  symbol: string;
  timestamp: string;
  type: 'breakout' | 'whale' | 'liquidation' | 'orderblock';
  changePercent?: number;
  price?: number;
  read: boolean;
}

export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'market' | 'derivatives' | 'analytics' | 'portfolio';
}

export interface UserSecurityState {
  mfaEnabled: boolean;
  mfaSecret?: string;
  biometricEnabled: boolean;
  biometricSupported: boolean;
  pinSet: boolean;
  isUnlocked: boolean;
  lastLogin: string;
  cloudSyncEnabled: boolean;
  lastSyncTime: string;
  apiKey: string;
}
