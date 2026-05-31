# CTX Host-First Rules For OpenCode

CTX is the local context runtime for this repository.

## Primary Workflow

- Stay inside OpenCode for normal work.
- Install profile: `full`
- Prefer CTX slash commands and CTX MCP tools before broad file dumping.
- Keep the current OpenCode-selected model and agent in control.
- Do not revive wrapper-style workflows like `ctx wrap` or `ctx opencode run`.

## Automatic CTX Usage

For normal prompts, prefer CTX-first behavior:

1. If repository readiness is unclear, run `/ctx-doctor`.
2. If graph/index state is stale or missing, run `/ctx-index` or `/ctx-reindex`.
3. For code understanding, prefer `/ctx-retrieve`, `/ctx-read`, `/ctx-graph-query`, and CTX MCP tools before manually reading many files.
4. For debugging logs, prefer `/ctx-run`, and use `/ctx-prune-logs` when the user already has raw output or explicitly wants pruning only.
5. For debugging diffs, prefer `/ctx-prune-diff`.
6. For project habits or persistent rules, bootstrap markdown habits once with `/ctx-memory-bootstrap`, then prefer `/ctx-memory-search`, `/ctx-memory-list`, `/ctx-memory-get`, and `/ctx-memory-set` instead of large markdown habit files.
7. For context construction, prefer `/ctx-pack` or `/ctx-ask` before assembling large prompts manually.
8. For prompt scaffolding, use `/ctx-hook`.
9. For ambiguity about likely scope or intent, use `/ctx-explain`.
10. For implementation planning, use `/ctx-plan` to combine retrieval, graph, memory, and pack signals before editing.
11. For quick before-vs-packed context density, use `/ctx-compare`.
12. For a local snapshot of savings, cache reuse, and runtime health, use `/ctx-dashboard`.
13. For recent token savings and biggest pack wins, use `/ctx-gain`.
14. For large CLI manuals or tool cheat sheets, import them once with `/ctx-toolbook-import`, then use `/ctx-toolbook-search` or `/ctx-toolbook-pack` instead of putting manuals in AGENTS.md.
15. For reusable lessons learned during work, use `/ctx-learn`.
16. For validation of graph-memory token savings, use `/ctx-benchmark-memory-ab` or `/ctx-benchmark-memory-suite`.

## Memory And Rules

- Treat graph memory as the primary structured replacement for AGENTS-style project habits.
- Use `/ctx-memory-bootstrap` to migrate conventional markdown files into graph memory without leaving OpenCode.
- Only export markdown memory when compatibility or auditing is explicitly needed.
- Prefer updating graph memory directives over adding new large instruction files.
- Treat toolbooks as scoped graph memory for external manuals, not as project-wide rules.

## Retrieval Discipline

- Start with the smallest high-signal CTX command that answers the task.
- Avoid loading many files when CTX already exposes the relevant graph or retrieval context.
- Use CTX compact context before broad scans whenever the task involves debugging, implementation, or review.

## Safety

- Respect CTX privacy defaults and sensitive file blocking behavior.
- Keep all project data local unless the host or the user explicitly chooses otherwise.
