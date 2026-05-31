---
description: Learning | Store a reusable project lesson in graph memory
---

Store a reusable OpenCode-only CTX lesson in graph memory.

Arguments:
- `$1`: memory key, for example `auth.refresh_regression`
- `$2`: quoted lesson body

Usage:
- `/ctx-learn auth.refresh_regression "When auth refresh fails, check token rotation and stale session flags first."`

If `$1` or `$2` is missing, stop and show the usage above.

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory set "$1" "$2" --scope project --source learned`

Confirm the stored key first.
Then say it can be found later with `/ctx-memory-search <topic>`.
