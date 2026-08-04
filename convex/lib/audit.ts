import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export async function appendAuditEvent(
  ctx: Pick<MutationCtx, "db">,
  args: {
    orgId?: Id<"organizations">;
    actorId: Id<"users"> | string;
    action: string;
    targetResource: string;
    metadata?: Record<string, unknown>;
    timestamp?: number;
  },
) {
  const metadata = args.metadata
    ? Object.fromEntries(
        Object.entries(args.metadata).filter(([, value]) => value !== undefined),
      )
    : undefined;
  return await ctx.db.insert("auditEvents", {
    orgId: args.orgId,
    actorId: args.actorId,
    action: args.action,
    targetResource: args.targetResource,
    metadata,
    timestamp: args.timestamp ?? Date.now(),
  });
}
