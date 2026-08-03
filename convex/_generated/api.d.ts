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
import type * as cms from "../cms.js";
import type * as estimates from "../estimates.js";
import type * as jobs from "../jobs.js";
import type * as leads from "../leads.js";
import type * as organizations from "../organizations.js";
import type * as portals from "../portals.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auditEvents: typeof auditEvents;
  auth: typeof auth;
  cms: typeof cms;
  estimates: typeof estimates;
  jobs: typeof jobs;
  leads: typeof leads;
  organizations: typeof organizations;
  portals: typeof portals;
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
