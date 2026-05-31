---
description: Debug | Run a shell command and return the pruned root cause
---

OpenCode-only CTX command runner for this repository.

Arguments:
- `$ARGUMENTS`: the exact shell command to execute

`$ARGUMENTS` must be a real shell command such as `npm test -- --grep "refresh"` or `cargo test auth_refresh`.
Do not treat `$ARGUMENTS` as a topic, label, or natural-language request.
If `$ARGUMENTS` does not look runnable, stop and tell the user to provide the exact shell command to execute.

!`'/opt/homebrew/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' --json host-run "$ARGUMENTS"`

Render exactly this compact markdown:
- `## 🧪 CTX Run`
- `**Summary**`
- `**Output**`
- `**Log**`

Put `summary` under `**Summary**`.
Put `pruned_output` under `**Output**`.
Under `**Log**`, print one compact metadata line with `exit_code`, `latency_ms`, and `raw_log_path`.

Keep any explanation to one short sentence.
