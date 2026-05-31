---
description: Context | Search CTX retrieval results for a query
---

Use CTX retrieval for this query:

$ARGUMENTS

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' retrieve "$ARGUMENTS" --limit 8 --json`

Render exactly this compact markdown:
- `## 🔎 CTX Retrieve`
- `**Top Hits**`
- `**Next**`

Start with the useful result immediately under `**Top Hits**`.
Show the top hits in a clean, predictable format using the returned `source`, `score`, `id`, and `reason`.
Use `**Next**` for a single sentence about the most useful follow-up.
Keep any follow-up summary to one short sentence.
