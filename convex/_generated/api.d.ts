/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auditEvents from "../auditEvents.js";
import type * as auth from "../auth.js";
import type * as checklists from "../checklists.js";
import type * as estimates from "../estimates.js";
import type * as fileActions from "../fileActions.js";
import type * as files from "../files.js";
import type * as jobs from "../jobs.js";
import type * as leads from "../leads.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditEvents: typeof auditEvents;
  auth: typeof auth;
  checklists: typeof checklists;
  estimates: typeof estimates;
  fileActions: typeof fileActions;
  files: typeof files;
  jobs: typeof jobs;
  leads: typeof leads;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

import type { ComponentApi as WorkOSAuthKitComponentApi } from "@convex-dev/workos-authkit/_generated/component.js";

export declare const components: {
  workOSAuthKit: WorkOSAuthKitComponentApi<"workOSAuthKit">;
};
