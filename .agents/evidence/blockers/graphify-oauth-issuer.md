# Blocker: Graphify OAuth authorization response issuer

Status: `OPEN`

Detected: 2026-08-15 (America/Los_Angeles)

Client: OpenAI Codex CLI `0.145.0`

Endpoint: `https://api.graphify.com/mcp`

## Configuration applied

The Graphify streamable HTTP MCP was registered with the user-authorized
configuration:

```toml
[mcp_servers.graphify]
url = "https://api.graphify.com/mcp"
auth = "oauth"
```

No API key or bearer token was added.

## Reproducible failure

`codex mcp login graphify` reaches the Graphify authorization server and
returns to Codex, but Codex rejects the callback with:

```text
Authorization server response missing required issuer:
expected https://api.graphify.com
```

The public authorization-server metadata declares both:

```json
{
  "issuer": "https://api.graphify.com",
  "authorization_response_iss_parameter_supported": true
}
```

The actual authorization response does not provide the declared `iss`
parameter. Transient client IDs, state values, authorization codes, and PKCE
material are intentionally omitted from this artifact.

## Required response

Graphify must make the authorization response consistent with its discovery
metadata, normally by returning `iss=https://api.graphify.com` in the OAuth
authorization response, or by correcting the advertised capability if issuer
identification is intentionally unsupported. After that change:

1. rerun `codex mcp login graphify`;
2. verify the authenticated MCP tool inventory;
3. execute a grounded repository query;
4. certify that all exposed tools are read-only except agent-memory writes;
5. only then replace the repository's working local Graphify adapter with the
   remote project-scoped endpoint.

## Stop decision

Remote Graphify identity and tool execution are not proven. The repository's
existing local Graphify adapter remains in place so agent discovery does not
regress while this external OAuth incompatibility is unresolved.

