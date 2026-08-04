import { z } from "zod";

export const BUYER_SEGMENTS = [
  "residential",
  "commercial",
  "public-sector",
] as const;

function compactWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

const optionalCompactText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const normalized = compactWhitespace(value);
      return normalized || undefined;
    });

export const leadSubmissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(120)
    .transform(compactWhitespace),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254)
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(32)
    .refine((value) => {
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 7 && digitCount <= 15;
    }, "Enter a valid phone number")
    .transform(normalizePhone),
  segment: z.enum(BUYER_SEGMENTS),
  serviceAddress: z
    .string()
    .trim()
    .min(5, "Enter the service address")
    .max(240)
    .transform(compactWhitespace),
  projectDetails: z
    .string()
    .trim()
    .min(20, "Tell us a little more about the project")
    .max(4000)
    .transform(compactWhitespace),
  desiredTimeframe: optionalCompactText(120),
  contactConsent: z.literal(true, {
    error: "Consent is required before we can contact you",
  }),
  sourcePath: z
    .string()
    .trim()
    .max(300)
    .regex(/^\/(?!\/)/, "Source path must be a site-relative path")
    .default("/estimate"),
  utmSource: optionalCompactText(120),
  utmMedium: optionalCompactText(120),
  utmCampaign: optionalCompactText(160),
  companyWebsite: z.string().max(200).optional().default(""),
  idempotencyKey: z.string().uuid(),
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;

export interface LeadPersistenceInput {
  idempotencyKey: string;
  fullName: string;
  email: string;
  phone: string;
  segment: (typeof BUYER_SEGMENTS)[number];
  serviceAddress: string;
  projectDetails: string;
  desiredTimeframe?: string;
  contactConsent: true;
  sourcePath: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  consentAt: number;
  createdAt: number;
}

export function prepareLeadForPersistence(
  submission: LeadSubmission,
  now: number,
): LeadPersistenceInput {
  return {
    idempotencyKey: submission.idempotencyKey,
    fullName: submission.fullName,
    email: submission.email,
    phone: submission.phone,
    segment: submission.segment,
    serviceAddress: submission.serviceAddress,
    projectDetails: submission.projectDetails,
    desiredTimeframe: submission.desiredTimeframe,
    contactConsent: true,
    sourcePath: submission.sourcePath,
    utmSource: submission.utmSource,
    utmMedium: submission.utmMedium,
    utmCampaign: submission.utmCampaign,
    consentAt: now,
    createdAt: now,
  };
}
