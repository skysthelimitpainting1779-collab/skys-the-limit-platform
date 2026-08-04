export type LeadIntakePayload = {
  orgId: string;
  idempotencyKey: string;
  fullName: string;
  email: string;
  phone: string;
  segment: "residential" | "commercial" | "public-sector";
  serviceAddress: string;
  projectDetails: string;
  desiredTimeframe?: string;
  contactConsent: true;
  sourcePath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

const PROOF_VERSION = "lead-intake-v1";
const MAX_PROOF_AGE_MS = 5 * 60 * 1_000;
const MAX_CLOCK_SKEW_MS = 30 * 1_000;
const MIN_SECRET_LENGTH = 32;
const encoder = new TextEncoder();

function requireSecret(secret: string) {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error("LEAD_INTAKE_SECRET_INVALID");
  }
  return secret;
}

function canonicalPayload(payload: LeadIntakePayload, issuedAt: number) {
  return JSON.stringify([
    PROOF_VERSION,
    issuedAt,
    payload.orgId,
    payload.idempotencyKey,
    payload.fullName,
    payload.email,
    payload.phone,
    payload.segment,
    payload.serviceAddress,
    payload.projectDetails,
    payload.desiredTimeframe ?? null,
    payload.contactConsent,
    payload.sourcePath,
    payload.utmSource ?? null,
    payload.utmMedium ?? null,
    payload.utmCampaign ?? null,
  ]);
}

async function importHmacKey(secret: string, usage: "sign" | "verify") {
  return await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(requireSecret(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

function toHex(value: ArrayBuffer) {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(value: string) {
  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export async function createLeadIntakeProof(
  secret: string,
  payload: LeadIntakePayload,
  issuedAt: number,
) {
  if (!Number.isSafeInteger(issuedAt) || issuedAt <= 0) {
    throw new Error("LEAD_INTAKE_TIMESTAMP_INVALID");
  }
  const key = await importHmacKey(secret, "sign");
  const signature = await globalThis.crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(canonicalPayload(payload, issuedAt)),
  );
  return toHex(signature);
}

export async function verifyLeadIntakeProof(
  secret: string,
  payload: LeadIntakePayload,
  issuedAt: number,
  proof: string,
  now = Date.now(),
) {
  if (
    !Number.isSafeInteger(issuedAt) ||
    issuedAt <= 0 ||
    issuedAt > now + MAX_CLOCK_SKEW_MS ||
    now - issuedAt > MAX_PROOF_AGE_MS ||
    !/^[0-9a-f]{64}$/i.test(proof)
  ) {
    return false;
  }
  const key = await importHmacKey(secret, "verify");
  return await globalThis.crypto.subtle.verify(
    "HMAC",
    key,
    fromHex(proof),
    encoder.encode(canonicalPayload(payload, issuedAt)),
  );
}
