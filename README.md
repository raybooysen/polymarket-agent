# polymarket-cli

> Polymarket prediction market sentiment for AI trading agents

<!-- badges -->
[![CI](https://github.com/raybooysen/polymarket-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/raybooysen/polymarket-agent/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/polymarket-cli)](https://www.npmjs.com/package/polymarket-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What it does

[Polymarket](https://polymarket.com) is the world's largest prediction market. Market prices **are** probabilities — when a "Will the Fed cut rates?" market trades at $0.65, the crowd says there's a 65% chance it happens.

This CLI pulls that data and computes structured sentiment signals designed for AI trading agents. No API key needed — Polymarket's APIs are public.

## Quick start

```bash
npx polymarket-cli sentiment
```

## Install

```bash
npm install -g polymarket-cli
```

Requires Node.js 22+ (uses native `fetch`).

## Commands

### `polymarket sentiment`

Compute a full sentiment snapshot with composite signals.

```bash
polymarket sentiment --pretty
```

```json
{
  "timestamp": "2025-03-25T12:00:00.000Z",
  "markets": {
    "fed-rate-cut-june": 0.65,
    "ukraine-ceasefire": 0.22,
    "bitcoin-100k": 0.58
  },
  "signals": [
    {
      "question": "Will the Fed cut rates before July?",
      "slug": "fed-rate-cut-june",
      "yesPrice": 0.65,
      "noPrice": 0.35,
      "volume24hr": 1250000,
      "volume": 15000000,
      "category": "monetary_policy",
      "url": "https://polymarket.com/event/fed-rate-cut-june"
    }
  ],
  "composites": {
    "geopoliticalRisk": 0.67,
    "monetaryPolicyDovish": 0.65,
    "riskAppetite": 0.52
  },
  "marketCount": 8,
  "avgVolume24h": 850000
}
```

### `polymarket markets`

Fetch and filter financially relevant markets.

```bash
polymarket markets --pretty --min-volume 200000
```

```json
[
  {
    "question": "Will the Fed cut rates before July?",
    "slug": "fed-rate-cut-june",
    "yesPrice": 0.65,
    "noPrice": 0.35,
    "volume24hr": 1250000,
    "category": "monetary_policy"
  }
]
```

### `polymarket search <query>`

Search markets by keyword.

```bash
polymarket search "fed rate" --limit 5
```

### `polymarket events`

List top events by volume.

```bash
polymarket events --limit 10 --pretty
```

### `polymarket market <slug>`

Get details for a single market by slug.

```bash
polymarket market fed-rate-cut-june --pretty
```

## Composite signals

The `sentiment` command computes three composite signals from market prices:

| Signal | Range | Meaning |
|--------|-------|---------|
| `geopoliticalRisk` | 0–1 | 0 = calm, 1 = crisis. Based on ceasefire vs escalation market prices. |
| `monetaryPolicyDovish` | 0–1 | 0 = hawkish, 1 = dovish. Volume-weighted average of Fed rate cut probabilities. |
| `riskAppetite` | 0–1 | 0 = risk-off, 1 = risk-on. Composite of BTC sentiment, inverse geo risk, and monetary policy. |

## For AI agents

### Shell exec

```bash
SENTIMENT=$(polymarket sentiment)
GEO_RISK=$(echo "$SENTIMENT" | jq '.composites.geopoliticalRisk')
if (( $(echo "$GEO_RISK > 0.7" | bc -l) )); then
  echo "HIGH GEOPOLITICAL RISK — reduce exposure"
fi
```

### Programmatic import

```typescript
import { computeSentiment } from 'polymarket-cli/sentiment/compute';
import { searchMarkets } from 'polymarket-cli/api/gamma';

const snapshot = await computeSentiment({ noCache: true });
console.log(snapshot.composites.geopoliticalRisk);

const fedMarkets = await searchMarkets('fed rate', 5);
```

### Example agent prompt

```
You have access to `polymarket sentiment` which returns real-time prediction market data.
Before any macro trade decision, run `polymarket sentiment` and check:
- geopoliticalRisk > 0.7 → reduce risk exposure
- monetaryPolicyDovish > 0.6 → favor rate-sensitive assets
- riskAppetite < 0.3 → defensive positioning
```

## Configuration

| Setting | Value |
|---------|-------|
| Cache location | `~/.cache/polymarket/` |
| Cache TTL | 30 minutes (configurable via `--cache-ttl`) |
| API key | **Not needed** — Polymarket APIs are public |
| Min volume | $100,000 (configurable via `--min-volume`) |

Use `--no-cache` to force fresh data.

## Development

```bash
git clone https://github.com/raybooysen/polymarket-agent.git
cd polymarket-agent
npm install
npm run typecheck
npm run test:unit
npm run test:integration  # calls live APIs
npm run build
```

## API

This CLI uses Polymarket's public APIs:

- **Gamma API** — `https://gamma-api.polymarket.com` — Market metadata, search, events
- **CLOB API** — `https://clob.polymarket.com` — Order book data, midpoints

## License

[MIT](LICENSE)
