# CLAUDE.md — Host Adapter

This file is a thin adapter. All governance rules, architecture decisions, branch policy, peer review protocol, and Context7 mandates are defined in [AGENTS.md](./AGENTS.md).

**Read AGENTS.md first. Always. Before any edit.**

## Claude-Specific Notes
- Use the `context7` MCP server tools: `resolve-library-id` then `query-docs`.
- Use `mcp__context7__resolve-library-id` and `mcp__context7__query-docs` tool names.
- The peer review mandate in AGENTS.md § 0 applies. Every implemented node requires an independent evaluator pass.
