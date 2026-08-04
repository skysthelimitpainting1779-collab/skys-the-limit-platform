// @vitest-environment edge-runtime

import { beforeAll, describe, expect, it } from "vitest";
import * as auditEvents from "./auditEvents";
import * as checklists from "./checklists";
import * as ci from "./ci";
import * as claims from "./claims";
import * as cms from "./cms";
import * as customers from "./customers";
import * as estimates from "./estimates";
import * as fileActions from "./fileActions";
import * as files from "./files";
import * as jobs from "./jobs";
import * as leadActions from "./leadActions";
import * as leads from "./leads";
import * as notifications from "./notifications";
import * as users from "./users";

const modules: Record<string, Record<string, unknown>> = {
  auditEvents,
  checklists,
  ci,
  claims,
  cms,
  customers,
  estimates,
  fileActions,
  files,
  jobs,
  leadActions,
  leads,
  notifications,
  users,
};

beforeAll(async () => {
  Object.assign(process.env, {
    WORKOS_CLIENT_ID: "client_local_inventory_test",
    WORKOS_API_KEY: "sk_" + "local_inventory_test",
    WORKOS_WEBHOOK_SECRET: "whsec_" + "local_inventory_test",
  });
  modules.auth = await import("./auth");
});

const EXPECTED_PUBLIC_API = [
  "auditEvents.listByEntity",
  "auditEvents.listRecent",
  "checklists.create",
  "checklists.deleteChecklist",
  "checklists.get",
  "checklists.listByJob",
  "checklists.toggleItem",
  "checklists.updateStatus",
  "claims.create",
  "claims.list",
  "claims.updateStatus",
  "cms.createDraft",
  "cms.getPublishedBySlug",
  "cms.listPages",
  "cms.updateContent",
  "cms.updateStatus",
  "customers.createFromLead",
  "customers.getMyPortal",
  "customers.linkUser",
  "customers.list",
  "estimates.calculateTotal",
  "estimates.create",
  "estimates.get",
  "estimates.list",
  "estimates.listByLead",
  "estimates.update",
  "fileActions.deleteDocument",
  "fileActions.finalizeUpload",
  "fileActions.generateUploadUrl",
  "fileActions.getCustomerDownloadUrl",
  "fileActions.getDownloadUrl",
  "files.getDocument",
  "files.listDocuments",
  "files.listMyCustomerDocuments",
  "jobs.addProjectUpdate",
  "jobs.assignCrew",
  "jobs.create",
  "jobs.createFromEstimate",
  "jobs.createTask",
  "jobs.get",
  "jobs.list",
  "jobs.listProjectUpdates",
  "jobs.listTasks",
  "jobs.update",
  "jobs.updateStatus",
  "jobs.updateTask",
  "leadActions.submit",
  "leads.get",
  "leads.list",
  "leads.search",
  "leads.updateStatus",
  "notifications.getUnreadCount",
  "notifications.listMine",
  "notifications.markAllAsRead",
  "notifications.markAsRead",
  "users.get",
  "users.getByClerkId",
  "users.getMyCapabilities",
  "users.getMyContext",
  "users.listAssignableCrew",
  "users.listTeamMemberships",
  "users.list",
  "users.store",
  "users.updateRole",
] as const;

const ANONYMOUS_ALLOWLIST = [
  // Anonymous transport requires a short-lived proof from the validated server route.
  "leadActions.submit",
  // Pure calculation over caller-provided data; no stored records are read.
  "estimates.calculateTotal",
  // These handlers return only verified, published content.
  "cms.getPublishedBySlug",
  "cms.listPages",
  // These handlers allow anonymous access only when the document is public.
  "files.getDocument",
  "files.listDocuments",
  "fileActions.getDownloadUrl",
] as const;

type RegisteredFunction = {
  isAction?: boolean;
  isInternal?: boolean;
  isMutation?: boolean;
  isQuery?: boolean;
};

function actualPublicApi() {
  const result: string[] = [];
  for (const [moduleName, moduleExports] of Object.entries(modules)) {
    for (const [exportName, value] of Object.entries(moduleExports)) {
      const registered = value as RegisteredFunction;
      if (
        !registered.isInternal &&
        (registered.isQuery || registered.isMutation || registered.isAction)
      ) {
        result.push(`${moduleName}.${exportName}`);
      }
    }
  }
  return result.sort();
}

describe("public Convex API inventory", () => {
  it("fails whenever a public RPC is added, removed, or made internal", () => {
    expect(actualPublicApi()).toEqual([...EXPECTED_PUBLIC_API].sort());
  });

  it("keeps the anonymous surface to the exact reviewed data-conditioned allowlist", () => {
    const inventory = new Set(actualPublicApi());
    for (const allowed of ANONYMOUS_ALLOWLIST) expect(inventory.has(allowed)).toBe(true);
    expect([...ANONYMOUS_ALLOWLIST].sort()).toEqual([
      "cms.getPublishedBySlug",
      "cms.listPages",
      "estimates.calculateTotal",
      "fileActions.getDownloadUrl",
      "files.getDocument",
      "files.listDocuments",
      "leadActions.submit",
    ]);
  });
});
