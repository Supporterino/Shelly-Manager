---
description: Toolbooks | Pack task context plus relevant toolbook guidance
---

Pack task context while also retrieving relevant OpenCode-only CTX toolbook guidance.

Arguments:
- `$1`: toolbook name, for example `glab`
- `$2`: quoted task/query, for example `"create merge request for auth fix"`

Usage:
- `/ctx-toolbook-pack glab "create merge request for auth fix"`

If `$1` or `$2` is missing, stop and show the usage above.

Toolbook matches:
!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory search "$2" --scope "toolbook:$1" --json`

Task context:
!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' pack "$2" --json`

Show the relevant toolbook matches first, then print `compact_context`, then a single metadata line with `packed_tokens`, `reduction_pct`, and `pack_path`.
Do not load or restate the full manual.
