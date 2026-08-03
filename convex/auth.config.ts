import type { AuthConfig } from "convex/server";

const workOSClientId = process.env.WORKOS_CLIENT_ID;

if (!workOSClientId || workOSClientId.includes("REPLACE_ME")) {
  throw new Error("WORKOS_CLIENT_ID must be configured for Convex auth");
}

const workOSApiBaseUrl = "https://api.workos.com";

export default {
  providers: [
    {
      type: "customJwt",
      issuer: `${workOSApiBaseUrl}/`,
      algorithm: "RS256",
      jwks: `${workOSApiBaseUrl}/sso/jwks/${workOSClientId}`,
      applicationID: workOSClientId,
    },
    {
      type: "customJwt",
      issuer: `${workOSApiBaseUrl}/user_management/${workOSClientId}`,
      algorithm: "RS256",
      jwks: `${workOSApiBaseUrl}/sso/jwks/${workOSClientId}`,
    },
  ],
} satisfies AuthConfig;
