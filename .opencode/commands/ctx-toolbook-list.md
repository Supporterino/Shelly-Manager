---
description: Toolbooks | List stored directives for one toolbook
---

List an OpenCode-only CTX toolbook.

Arguments:
- `$1`: toolbook name, for example `glab`
- `$2`: optional limit

Usage:
- `/ctx-toolbook-list glab`
- `/ctx-toolbook-list glab 30`

If `$1` is missing, stop and show the usage above.

Run `'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory list --scope "toolbook:$1"` and add `--limit "$2"` only when a limit was provided.
Show the stored directives first, then add one short sentence about how to search them.
