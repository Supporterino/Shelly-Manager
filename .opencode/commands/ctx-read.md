---
description: Context | Read one file with CTX cache-aware modes
---

OpenCode-only CTX file read with session cache / re-read compression.

Arguments:
- `$1`: required file path
- `$2`: optional mode, one of `full`, `outline`, or `digest`

Usage:
- `/ctx-read src/auth.ts`
- `/ctx-read src/auth.ts outline`
- `/ctx-read docs/runbook.md digest`

If `$1` is missing, stop and show the usage above.

Run:
!`mode="${2:-digest}"; '/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' --json host-read "$1" --mode "$mode"`

Render exactly this compact markdown:
- `## 📖 CTX Read`
- `**Content**`
- `**Metadata**`

Print `output` under `**Content**`.
Then print one compact metadata line under `**Metadata**` with `mode`, `cache_hit`, `fingerprint`, and `path`.
Keep any explanation to one short sentence.
