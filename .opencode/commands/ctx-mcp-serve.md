---
description: MCP | Show or start the CTX MCP HTTP server
---

Prepare the CTX MCP HTTP server for this repository.

Arguments:
- `$1`: optional port, default `8765`

If the user wants the server started in this session, run `'/usr/local/bin/ctx' --repo-root '/Users/supporterino/WebstormProjects/Shelly-Manager' mcp serve --port <port>`.
Otherwise, show the exact command to run and explain that it is a long-running local process.
