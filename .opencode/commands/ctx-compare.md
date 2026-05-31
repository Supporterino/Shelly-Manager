---
description: Context | Show before-vs-CTX context density for a task
---

OpenCode-only CTX comparison for this task:

$ARGUMENTS

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' pack "$ARGUMENTS" --json`

Print a compact `Before vs CTX` table first using:
- `original_estimated_tokens` as the broad-context estimate
- `packed_tokens` as the CTX task pack size
- `reduction_pct` as the reduction
- `pack_path` as the saved artifact

Then list included and excluded categories in one compact block.
Do not claim benchmark quality from this command; it is a task-pack density check.
