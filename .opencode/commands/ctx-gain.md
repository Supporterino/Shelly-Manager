---
description: Benchmark | Show recent CTX token savings and biggest wins
---

OpenCode-only CTX gain report for this repository.

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' --json stats --history 20`

Render exactly this compact markdown:
- `## 💸 CTX Gain`
- `**Savings**`
- `**Top Queries**`
- `**Artifacts**`

Under `**Savings**`, include:
- `sampled_runs`
- `estimated_tokens_saved`
- `latest_reduction_pct`
- `average_reduction_pct`
- `max_reduction_pct`

Under `**Top Queries**`, list `top_queries`.

If `latest_pack_path` is present, show it under `**Artifacts**` on one compact line.
Keep any follow-up explanation to one short sentence.
