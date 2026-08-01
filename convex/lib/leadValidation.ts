export type LeadSegment = "residential" | "commercial" | "public-sector";

export interface LeadMutationInput {
  idempotencyKey: string;
  fullName: string;
  email: string;
  phone: string;
  segment: LeadSegment;
  serviceAddress: string;
  projectDetails: string;
  desiredTimeframe?: string;
  sourcePath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/;
const SOURCE_PATH_PATTERN = /^\/(?!\/)[^\s]*$/;

function compactWhitespace(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim();
}

function optionalCompactWhitespace(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const normalized = compactWhitespace(value);
  return normalized || undefined;
}

function invalid(): never {
  // Keep the public error intentionally generic so validation cannot echo PII.
  throw new Error("INVALID_LEAD_INPUT");
}

function assertText(value: string, min: number, max: number): void {
  if (typeof value !== "string" || value.length < min || value.length > max) {
    invalid();
  }
}

function assertOptionalText(value: string | undefined, max: number): void {
  if (value !== undefined && (typeof value !== "string" || value.length > max)) {
    invalid();
  }
}

export function assertLeadMutationInput(input: LeadMutationInput): void {
  if (!UUID_PATTERN.test(input.idempotencyKey)) invalid();
  assertText(input.fullName, 2, 120);
  assertText(input.email, 3, 254);
  if (!EMAIL_PATTERN.test(input.email)) invalid();
  if (!PHONE_PATTERN.test(input.phone)) invalid();
  if (!(["residential", "commercial", "public-sector"] as const).includes(input.segment)) {
    invalid();
  }
  assertText(input.serviceAddress, 5, 240);
  assertText(input.projectDetails, 20, 4000);
  assertOptionalText(input.desiredTimeframe, 120);
  assertText(input.sourcePath, 1, 300);
  if (!SOURCE_PATH_PATTERN.test(input.sourcePath)) invalid();
  assertOptionalText(input.utmSource, 120);
  assertOptionalText(input.utmMedium, 120);
  assertOptionalText(input.utmCampaign, 160);
}

export function normalizeLeadMutationInput(
  input: LeadMutationInput,
): LeadMutationInput {
  const normalized: LeadMutationInput = {
    idempotencyKey: input.idempotencyKey.trim().toLowerCase(),
    fullName: compactWhitespace(input.fullName),
    email: input.email.normalize("NFKC").trim().toLowerCase(),
    phone: input.phone.trim(),
    segment: input.segment,
    serviceAddress: compactWhitespace(input.serviceAddress),
    projectDetails: compactWhitespace(input.projectDetails),
    desiredTimeframe: optionalCompactWhitespace(input.desiredTimeframe),
    sourcePath: input.sourcePath.trim(),
    utmSource: optionalCompactWhitespace(input.utmSource),
    utmMedium: optionalCompactWhitespace(input.utmMedium),
    utmCampaign: optionalCompactWhitespace(input.utmCampaign),
  };

  assertLeadMutationInput(normalized);
  return normalized;
}
