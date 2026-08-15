# Blocker: plaintext Context7 credential exposure

Status: `OPEN`

Detected: 2026-08-14 (America/Los_Angeles)

Scope: user-level Google Antigravity MCP configuration; no repository-owned
credential was found.

## Evidence

During read-only certification of the installed Antigravity MCP surface, the
user-level MCP configuration returned a plaintext Context7 API credential. The
credential value was emitted by the local inspection command into the agent
tool transcript and is intentionally omitted from this evidence artifact.

Affected configuration:

`C:\Users\Johnny Cage\.gemini\config\mcp_config.json`

## Required response

1. A human revokes or rotates the exposed Context7 credential at the provider.
2. The replacement credential is stored through an environment, keychain, or
   other host-managed secret mechanism rather than as plaintext in the MCP
   configuration.
3. A redacted read-only inspection confirms that the configuration no longer
   contains inline credential material.
4. Connector certification restarts from a new exact candidate SHA.

## Stop decision

The cross-host connector/compiler work is paused. No credential, WorkOS,
Vercel, Convex, DNS, deployment, or Production mutation was performed after
detection. The active goal must not advance to connector parity, Preview
remediation, V7, A9, A10, or V10 until the required response above is complete.

