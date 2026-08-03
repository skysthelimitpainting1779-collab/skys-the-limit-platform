import { AuthKit, type AuthFunctions } from "@convex-dev/workos-authkit";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";

type RequiredWorkOSValue =
  | "WORKOS_CLIENT_ID"
  | "WORKOS_API_KEY"
  | "WORKOS_WEBHOOK_SECRET";

function requireConfiguredWorkOSValue(name: RequiredWorkOSValue): string {
  const value = process.env[name];
  if (!value || value.includes("REPLACE_ME")) {
    throw new Error(`${name} must be configured for Convex AuthKit`);
  }
  return value;
}

const configuredClientId = requireConfiguredWorkOSValue("WORKOS_CLIENT_ID");
const configuredApiKey = requireConfiguredWorkOSValue("WORKOS_API_KEY");
const configuredWebhookSecret = requireConfiguredWorkOSValue(
  "WORKOS_WEBHOOK_SECRET",
);

const authFunctions: AuthFunctions = internal.auth;

export const authKit = new AuthKit<DataModel>(components.workOSAuthKit, {
  authFunctions,
  clientId: configuredClientId,
  apiKey: configuredApiKey,
  webhookSecret: configuredWebhookSecret,
});

type WorkOSProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePictureUrl?: string | null;
};

function displayName(profile: WorkOSProfile): string {
  return [profile.firstName, profile.lastName]
    .filter((part): part is string => Boolean(part?.trim()))
    .join(" ") || profile.email;
}

async function syncVerifiedProfile(ctx: MutationCtx, profile: WorkOSProfile) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_externalId", (query) => query.eq("externalId", profile.id))
    .unique();
  const verifiedProfile = {
    externalId: profile.id,
    email: profile.email,
    name: displayName(profile),
    avatarUrl: profile.profilePictureUrl ?? undefined,
    identitySource: "workos_webhook" as const,
    identityStatus: "active" as const,
  };

  if (existing) {
    await ctx.db.patch(existing._id, verifiedProfile);
    return existing._id;
  }

  return await ctx.db.insert("users", {
    ...verifiedProfile,
    role: "customer",
  });
}

export const { authKitEvent } = authKit.events({
  "user.created": async (ctx, event) => {
    await syncVerifiedProfile(ctx, event.data);
  },
  "user.updated": async (ctx, event) => {
    await syncVerifiedProfile(ctx, event.data);
  },
  "user.deleted": async (ctx, event) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_externalId", (query) =>
        query.eq("externalId", event.data.id),
      )
      .unique();
    if (user) {
      await ctx.db.patch(user._id, { identityStatus: "disabled" });
    }
  },
});

export const { backfillUsers } = authKit.utils();
