---
description: Toolbooks | Import a CLI manual or playbook into graph memory
---

Import an external CLI manual, runbook, or tool cheat sheet as an OpenCode-only CTX toolbook.

Arguments:
- `$1`: toolbook name, for example `glab`
- `$2`: markdown file path

Usage:
- `/ctx-toolbook-import glab docs/glab.md`

If `$1` or `$2` is missing, stop and show the usage above.

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory import --from "$2" --scope "toolbook:$1" --source toolbook --prefix "toolbook.$1"`

Show the import result first.
Then say that future searches should use `/ctx-toolbook-search $1 "<query>"` instead of loading the whole manual into AGENTS.md.
