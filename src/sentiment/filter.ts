import type { GammaMarket, MarketCategory, MarketSignal } from '../types.js';

const DEFAULT_MIN_VOLUME = 100_000;

// Order matters: more specific categories first to avoid false matches
// e.g. "trade war" should match trade_policy, not geopolitical's "war"
const KEYWORD_ENTRIES: Array<[Exclude<MarketCategory, 'other'>, string[]]> = [
  ['trade_policy', ['tariff', 'trade war', 'china trade', 'import', 'export ban']],
  ['monetary_policy', ['fed', 'rate cut', 'rate hike', 'fomc', 'powell', 'interest rate', 'quantitative']],
  ['geopolitical', ['war', 'ceasefire', 'iran', 'ukraine', 'military', 'sanctions', 'invasion', 'regime', 'israel', 'gaza', 'lebanon', 'hezbollah', 'hamas', 'nato', 'offensive', 'airstrike', 'nuclear', 'missile', 'conflict', 'troops', 'escalat']],
  ['economic', ['recession', 'gdp', 'inflation', 'unemployment', 'cpi', 'jobs report', 'nonfarm', 'treasury', 'debt ceiling', 'default']],
  ['crypto', ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'etf approval', 'solana', 'sol price']],
];

export function categoriseMarket(question: string): MarketCategory {
  const lower = question.toLowerCase();
  for (const [category, keywords] of KEYWORD_ENTRIES) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category;
      }
    }
  }
  return 'other';
}

export function extractPrice(outcomePrices: string): { yes: number; no: number } {
  try {
    const parsed = JSON.parse(outcomePrices) as string[];
    const yes = parseFloat(parsed[0]);
    const no = parseFloat(parsed[1]);
    if (isNaN(yes) || isNaN(no)) return { yes: 0, no: 0 };
    return { yes, no };
  } catch {
    return { yes: 0, no: 0 };
  }
}

export function filterRelevantMarkets(
  markets: GammaMarket[],
  minVolume?: number
): MarketSignal[] {
  const threshold = minVolume ?? DEFAULT_MIN_VOLUME;

  const results: MarketSignal[] = [];

  for (const m of markets) {
    if (!m.active || m.closed || m.volume24hr < threshold) continue;

    const category = categoriseMarket(m.question);
    if (category === 'other') continue;

    const { yes, no } = extractPrice(m.outcomePrices);

    results.push({
      question: m.question,
      slug: m.slug,
      yesPrice: yes,
      noPrice: no,
      volume24hr: m.volume24hr,
      volume: m.volume,
      category,
      url: `https://polymarket.com/event/${m.slug}`,
    });
  }

  return results;
}
