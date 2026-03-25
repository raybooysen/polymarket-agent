export interface GammaMarket {
  id: string;
  question: string;
  slug: string;
  conditionId: string;
  outcomePrices: string;  // JSON string: '["0.185","0.815"]'
  volume: number;
  volume24hr: number;
  active: boolean;
  closed: boolean;
  endDate: string;
  description: string;
  tags: string[];
}

export interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  markets: GammaMarket[];
  volume: number;
  active: boolean;
}

export type MarketCategory =
  'monetary_policy' | 'geopolitical' | 'economic' |
  'crypto' | 'trade_policy' | 'other';

export interface MarketSignal {
  question: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  volume24hr: number;
  volume: number;
  category: MarketCategory;
  url: string;
}

export interface CompositeSignals {
  geopoliticalRisk: number;      // 0=calm, 1=crisis
  monetaryPolicyDovish: number;  // 0=hawkish, 1=dovish
  riskAppetite: number;          // 0=risk-off, 1=risk-on
}

export interface SentimentSnapshot {
  timestamp: string;
  markets: Record<string, number>;
  signals: MarketSignal[];
  composites: CompositeSignals;
  marketCount: number;
  avgVolume24h: number;
  cachedAt?: string;
}
