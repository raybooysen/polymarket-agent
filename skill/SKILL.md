---
name: polymarket
description: Pull real-time prediction market sentiment from Polymarket. Use for macro/geopolitical signals in trading decisions. No API key needed.
homepage: https://polymarket.com
metadata:
  openclaw:
    emoji: "📊"
    requires:
      bins: ["polymarket"]
    install:
      - id: npm
        kind: npm
        package: polymarket-cli
        bins: ["polymarket"]
        label: "Install polymarket-cli (npm)"
---

# Polymarket Sentiment

Get money-weighted sentiment signals from Polymarket prediction markets.

## Quick start

- `polymarket sentiment` — full sentiment snapshot (JSON)
- `polymarket markets` — list financially relevant markets with prices
- `polymarket search "fed rate"` — search for specific markets
- `polymarket events` — top events by volume
- `polymarket market <slug>` — details for one market

## When to use

- Before making trading decisions — check geopolitical risk, rate expectations
- Daily macro briefing — what does the crowd expect?
- Monitoring specific events — tariffs, fed meetings, conflicts
- As an input signal for autonomous trading strategies

## Output format

`polymarket sentiment` returns JSON:
```json
{
  "composites": {
    "geopoliticalRisk": 0.67,
    "monetaryPolicyDovish": 0.35,
    "riskAppetite": 0.58
  },
  "marketCount": 12,
  "avgVolume24h": 1500000
}
```

## Signal meanings

- `geopoliticalRisk` — 0 (calm) to 1 (crisis). Based on ceasefire/escalation market prices.
- `monetaryPolicyDovish` — 0 (hawkish) to 1 (dovish). Based on Fed rate cut probabilities.
- `riskAppetite` — 0 (risk-off) to 1 (risk-on). Composite of BTC sentiment, inverse geo risk, and monetary policy.

## Examples

```bash
# Full sentiment for trading decisions
polymarket sentiment | jq '.composites'

# Check geopolitical risk level
polymarket sentiment | jq '.composites.geopoliticalRisk'

# Find Fed-related markets
polymarket search "fed rate" --limit 5

# Pretty print
polymarket sentiment --pretty
```

## Notes

- No API key required — Polymarket APIs are public
- Results cached for 30 minutes by default (use `--no-cache` to force fresh)
- Only includes markets with >$100k 24h volume (adjustable with `--min-volume`)
