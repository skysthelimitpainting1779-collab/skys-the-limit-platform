import "server-only";

import Zernio from "@zernio/node";

let zernioClient: Zernio | undefined;

function requireZernioApiKey(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const apiKey = environment.ZERNIO_API_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "ZERNIO_API_KEY is required for server-side Zernio operations.",
    );
  }

  return apiKey;
}

function getZernioClient(): Zernio {
  if (!zernioClient) {
    zernioClient = new Zernio({ apiKey: requireZernioApiKey() });
  }

  return zernioClient;
}

export { getZernioClient, requireZernioApiKey };
