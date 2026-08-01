# GEMINI.md — Antigravity Host Adapter
# Sky's the Limit Platform

> Full governance: [AGENTS.md](./AGENTS.md)
> Workspace enforcement rule: [.agents/AGENTS.md](./.agents/AGENTS.md) (auto-injected by Antigravity)

---

## 1. SESSION START — NON-NEGOTIABLE

Before any edit, run the `session-start` skill (`.agents/skills/session-start/SKILL.md`).

Exact tool sequence:
```
1. view_file → graphify-out/reflections/LESSONS.md
2. call_mcp_tool → codebase-memory-mcp/query_graph  { "query": "<task>" }
3. view_file → convex/_generated/ai/guidelines.md   (if touching Convex)
4. call_mcp_tool → context7/resolve-library-id      (if touching any library)
5. call_mcp_tool → context7/query-docs              (immediately after resolve)
6. run_command  → git branch --show-current
```

---

## 2. CONTEXT7 — EXACT TOOL NAMES

MCP server name: `context7`

```
call_mcp_tool  context7  resolve-library-id  { "libraryName": "convex" }
call_mcp_tool  context7  query-docs          { "context7CompatibleLibraryID": "/convex-dev/convex", "topic": "mutations" }
```

Use for: Convex, Next.js, shadcn/ui, motion/react, Stripe, WorkOS, Resend, Vercel Blob.
**Never use training-data API knowledge directly.**

---

## 3. GRAPHIFY — EXACT TOOL NAMES

MCP server name: `codebase-memory-mcp`

```
call_mcp_tool  codebase-memory-mcp  query_graph   { "query": "leads mutation validation" }
call_mcp_tool  codebase-memory-mcp  trace_path    { "from": "EstimateForm", "to": "leads.create" }
call_mcp_tool  codebase-memory-mcp  get_code_snippet { "nodeId": "..." }
call_mcp_tool  codebase-memory-mcp  search_code   { "query": "useQuery" }
```

**grep / list_dir / view_file = last resort only.** Always Graphify first.

---

## 4. SEQUENTIAL THINKING — EXACT TOOL NAME

MCP server name: `sequential-thinking`

```
call_mcp_tool  sequential-thinking  sequentialthinking  { "thought": "...", "nextThoughtNeeded": true }
```

Required when: multi-file refactor, ambiguous CI failure, schema design, API contract change.

---

## 5. PEER REVIEW — EXACT SUBAGENT PATTERN

After every node implementation (AGENTS.md §0):

```
invoke_subagent {
  TypeName: "self",
  Role: "Peer Evaluator — Independent Review",
  Prompt: "<paste peer-evaluator skill template from .agents/skills/peer-evaluator/SKILL.md>"
}
```

Record verdict to `.agent/state/nodes/<node-id>.json` before pushing.

---

## 6. CONVEX GUIDELINES

Read this file before every Convex edit:
```
view_file  convex/_generated/ai/guidelines.md
```

Overrides training data. Non-negotiable.

---

## 7. PRODUCTION STOP CONDITIONS

**Stop and ask the user before:**
- Merging `dev → main`
- Deploying to Production Vercel environment
- Mutating production Convex data
- Rotating credentials
- Deleting branches or data

---

## 8. CONTENT INTEGRITY (platform-specific)

The test at `src/__tests__/content-integrity.test.ts` bans:
- Raw Tailwind palette classes: `bg-slate-*`, `text-gray-*`, `border-zinc-*`
- Raw hex colors: `#[0-9a-f]{3,8}`
- Operational claims: `low-voc`, `zero-voc`, `background-checked`, `prevailing wage`, `certified payroll`, `osha 30`, `factory-grade`, `scalable workforce`, `night and weekend shifts`, `bonding capacity`

Use semantic tokens: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`

---

## 9. FIELD NAMES (after schema migration)

Leads table uses: `fullName`, `segment`, `serviceAddress`, `projectDetails`  
NOT: `customerName`, `projectType`, `address`
