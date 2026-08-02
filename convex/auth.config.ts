const configuredClientId = process.env.WORKOS_CLIENT_ID;

// A non-existent client ID keeps CI and unconfigured environments fail-closed
// without accepting tokens from any real WorkOS tenant.
const clientId =
  configuredClientId && !configuredClientId.includes("REPLACE_ME")
    ? configuredClientId
    : "client_UNCONFIGURED_FAIL_CLOSED";

const authConfig = {
  providers: [
    {
      type: "customJwt" as const,
      issuer: "https://api.workos.com/",
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
      applicationID: clientId,
    },
    {
      type: "customJwt" as const,
      issuer: `https://api.workos.com/user_management/${clientId}`,
      algorithm: "RS256" as const,
      jwks: `https://api.workos.com/sso/jwks/${clientId}`,
    },
  ],
};

export default authConfig;
