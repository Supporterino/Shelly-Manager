---
description: Toolbooks | Search a stored CLI/tool manual without prompt bloat
---

Search an OpenCode-only CTX toolbook.

Arguments:
- `$1`: toolbook name, for example `glab`
- `$2`: quoted query, for example `"merge request create"`

Usage:
- `/ctx-toolbook-search glab "merge request create"`

If `$1` or `$2` is missing, stop and show the usage above.

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory search "$2" --scope "toolbook:$1" --json`

Show only the matching directives in a compact, predictable format.
Do not summarize the full manual or add unrelated CLI flags.
