/// <reference types="vite/client" />
// @vitest-environment edge-runtime

import { convexTest } from "convex-test";
import { anyApi } from "convex/server";
import { afterEach, describe, expect, it } from "vitest";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

describe("Convex deployment bootstrap", () => {
  afterEach(() => {
    delete process.env.WORKOS_ORGANIZATION_ID;
  });

  it("idempotently seeds a Preview organization from its stable WorkOS ID", async () => {
    process.env.WORKOS_ORGANIZATION_ID = "org_preview_workos";
    const t = convexTest(schema, modules);

    const first = await t.mutation(anyApi.ci.ensurePreviewOrganization, {});
    const duplicate = await t.mutation(
      anyApi.ci.ensurePreviewOrganization,
      {},
    );

    expect(duplicate).toBe(first);
    await t.run(async (ctx) => {
      await expect(ctx.db.get(first)).resolves.toMatchObject({
        workosOrganizationId: "org_preview_workos",
        status: "active",
      });
    });
  });

  it("fails closed when the Preview WorkOS organization is not configured", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(anyApi.ci.ensurePreviewOrganization, {}),
    ).rejects.toThrow("WORKOS_ORGANIZATION_ID_NOT_CONFIGURED");
  });
});
