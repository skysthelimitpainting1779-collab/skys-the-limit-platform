/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { describe, expect, it } from "vitest";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { isConfiguredEnvironmentValue } from "./lib/workosEnvironment";
import schema from "./schema";

Object.assign(process.env, {
  WORKOS_CLIENT_ID: "client_local_convex_test",
  WORKOS_API_KEY: "sk_" + "test_local_convex_test",
  WORKOS_WEBHOOK_SECRET: "whsec_" + "local_convex_test",
  WORKOS_ACTION_SECRET: "action_local_convex_test",
});

const modules = import.meta.glob("./**/*.ts");
const issuerA = "https://issuer-a.example/";
const issuerB = "https://issuer-b.example/";

function identity(subject: string, issuer = issuerA) {
  return {
    subject,
    issuer,
    tokenIdentifier: `${issuer}|${subject}`,
    email: `${subject}@example.com`,
  };
}

describe("WorkOS identity binding", () => {
  it("treats copied environment placeholders as unconfigured", () => {
    expect(isConfiguredEnvironmentValue(undefined)).toBe(false);
    expect(isConfiguredEnvironmentValue("client_REPLACE_ME")).toBe(false);
    expect(
      isConfiguredEnvironmentValue(
        "replace_with_environment_specific_webhook_secret",
      ),
    ).toBe(false);
    expect(
      isConfiguredEnvironmentValue("environment-specific-webhook-secret"),
    ).toBe(true);
  });

  it("binds only webhook-verified profiles and ignores caller role input", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "ordinary-user",
        email: "ordinary-user@example.com",
        firstName: "Ordinary",
        lastName: "User",
        profilePictureUrl: null,
      },
    });

    const actor = t.withIdentity({
      ...identity("ordinary-user"),
      role: "owner",
      permissions: ["admin:*"],
    });
    const userId = await actor.mutation(anyApi.users.store, {});
    const stored = await t.run((ctx) => ctx.db.get(userId));
    expect(stored).toMatchObject({
      externalId: "ordinary-user",
      tokenIdentifier: `${issuerA}|ordinary-user`,
      role: "customer",
      identitySource: "workos_webhook",
      identityStatus: "active",
    });

    const memberships = await t.run((ctx) =>
      ctx.db
        .query("memberships")
        .withIndex("by_user", (index) => index.eq("userId", userId))
        .collect(),
    );
    expect(memberships).toEqual([]);
    await expect(
      actor.mutation(anyApi.users.store, { role: "owner" }),
    ).rejects.toThrow();
  });

  it("does not bind the same subject from a different issuer", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalId: "shared-subject",
        tokenIdentifier: `${issuerA}|shared-subject`,
        identitySource: "workos_webhook",
        identityStatus: "active",
        email: "shared-subject@example.com",
        name: "Issuer A User",
        role: "customer",
      }),
    );

    await expect(
      t
        .withIdentity(identity("shared-subject", issuerB))
        .mutation(anyApi.users.store, {}),
    ).rejects.toThrow("IDENTITY_BINDING_REQUIRED");
  });

  it("disables deleted WorkOS identities", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.created",
      data: {
        id: "deleted-user",
        email: "deleted-user@example.com",
        firstName: "Deleted",
        lastName: "User",
        profilePictureUrl: null,
      },
    });
    const actor = t.withIdentity(identity("deleted-user"));
    await actor.mutation(anyApi.users.store, {});
    await t.mutation(internal.auth.authKitEvent, {
      event: "user.deleted",
      data: { id: "deleted-user" },
    });
    await expect(actor.mutation(anyApi.users.store, {})).rejects.toThrow(
      "USER_DISABLED",
    );
  });

  it("prevents an admin from demoting an owner membership", async () => {
    const t = convexTest(schema, modules);
    let orgId!: Id<"organizations">;
    let ownerId!: Id<"users">;
    await t.run(async (ctx) => {
      orgId = await ctx.db.insert("organizations", {
        name: "Role Security",
        slug: "role-security",
        status: "active",
      });
      ownerId = await ctx.db.insert("users", {
        externalId: "role-owner",
        tokenIdentifier: `${issuerA}|role-owner`,
        identityStatus: "active",
        email: "role-owner@example.com",
        name: "Role Owner",
        role: "owner",
      });
      const adminId = await ctx.db.insert("users", {
        externalId: "role-admin",
        tokenIdentifier: `${issuerA}|role-admin`,
        identityStatus: "active",
        email: "role-admin@example.com",
        name: "Role Admin",
        role: "admin",
      });
      await ctx.db.insert("memberships", {
        userId: ownerId,
        orgId,
        role: "owner",
        status: "active",
      });
      await ctx.db.insert("memberships", {
        userId: adminId,
        orgId,
        role: "admin",
        status: "active",
      });
    });

    await expect(
      t.withIdentity(identity("role-admin")).mutation(anyApi.users.updateRole, {
        userId: ownerId,
        orgId,
        role: "customer",
      }),
    ).rejects.toThrow("FORBIDDEN");
  });
});
