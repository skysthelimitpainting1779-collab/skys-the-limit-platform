## 2026-08-01T18:16:23Z

<USER_REQUEST>
You are Worker 3 (`worker_m4_devops_vercel`) for Sky's the Limit Platform Foundation setup.
Working directory: C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m4_devops_vercel\
Work Node ID: node-m4-devops-vercel

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY CONTEXT7 PROTOCOL:
You MUST use Context7 MCP (`resolve-library-id` + `query-docs`) for any Vercel configuration or GitHub API integration research before executing commands.

Your Tasks:
1. Inspect and verify GitHub Branch Protection rulesets in `.github/rulesets/`:
   - Inspect `.github/rulesets/dev.json` and `.github/rulesets/main.json`.
   - Ensure the JSON files define target branches (`dev`, `main`), require status checks (CI & Security), block force pushes, and require PR reviews.
   - Create `.github/rulesets/README.md` documenting the ruleset setup and manual apply commands (via `gh api`) if owner approval is required.
   - Run `gh api` commands to test or apply rulesets if authenticated with required privileges.
2. Verify and configure Vercel project linkage:
   - Check `.vercel/project.json` or run `vercel` commands to confirm project `skys-the-limit-platform` is linked to repository `skysthelimitpainting1779-collab/skys-the-limit-platform`.
   - Confirm branch mapping: `main` → Production, `dev` → Preview.
   - MANDATORY SAFETY CHECK: Confirm NO production domain (e.g. skysthelimitpainting.com) is attached to the Vercel project.
3. Run `npm run verify` (`verify:skills`, `verify:env`, `typecheck`, `test`, `build`) to confirm total project health.
4. Write your detailed handoff report to `C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_m4_devops_vercel\handoff.md` and send a message when complete.
</USER_REQUEST>
