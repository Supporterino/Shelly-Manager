---
description: Memory | Read one CTX memory directive by key
---

Read a CTX memory directive from the current repository.

Argument:
- `$1`: directive key

!`'/usr/local/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' memory get "$1"`

If the directive is missing, say that clearly and suggest the matching CTX memory set action.
