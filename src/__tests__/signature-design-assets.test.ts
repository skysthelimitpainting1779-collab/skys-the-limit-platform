import { describe, expect, it } from "vitest";
import { DESIGN_ASSET_REGISTRY, isCandidateAllowedInCurrentEnv, getSafeAssetPath } from "@/design/assets/registry";

describe("Signature Design Asset Registry Governance", () => {
  it("registers canonical logo asset BRAND-001 as approved-brand-asset", () => {
    const logo = DESIGN_ASSET_REGISTRY["BRAND-001"];
    expect(logo).toBeDefined();
    expect(logo.status).toBe("approved-brand-asset");
    expect(logo.localPath).toBe("/brand/sky-logo-illustrated-badge.jpg");
    expect(logo.originalSha256).toBe("615fe916e4db10a85da32e5674d5504c08c5452f2ed1aed405a30a88a2856856");
  });

  it("blocks unverified candidates in production environment", () => {
    // Simulate production environment
    const origVercelEnv = process.env.VERCEL_ENV;
    const origPreview = process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW;

    process.env.VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW = "true";

    expect(isCandidateAllowedInCurrentEnv()).toBe(false);

    // Fallback path should be returned for unverified candidate in production
    const candidatePath = getSafeAssetPath("PHOTO-003");
    expect(candidatePath).toBe("/brand/sky-logo-illustrated-badge.jpg");

    // Restore env
    process.env.VERCEL_ENV = origVercelEnv;
    process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW = origPreview;
  });

  it("allows candidate assets when preview flag is enabled outside production", () => {
    const origVercelEnv = process.env.VERCEL_ENV;
    const origPreview = process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW;

    process.env.VERCEL_ENV = "preview";
    process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW = "true";

    expect(isCandidateAllowedInCurrentEnv()).toBe(true);
    const candidatePath = getSafeAssetPath("PHOTO-003");
    expect(candidatePath).toBe("/design-lab/candidates/light-pole-painting.webp");

    process.env.VERCEL_ENV = origVercelEnv;
    process.env.NEXT_PUBLIC_SIGNATURE_DESIGN_PREVIEW = origPreview;
  });
});
