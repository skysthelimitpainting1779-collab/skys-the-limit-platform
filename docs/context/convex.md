# Convex Reactive Backend Context & Contract

- **Research Date**: 2026-07-31
- **Official Source**: Context7 `/websites/convex_dev` & `/get-convex/convex-auth`
- **Selected Version / Contract**: Convex v1.x TypeScript Client
- **Decision Affected**: Database schema, real-time subscriptions, operational business state ownership.
- **Important Constraints**:
  - Convex owns operational business state (leads, estimates, jobs, audit logs).
  - Explicit authorization checks in Convex functions using membership queries.
  - Schedules deterministic database-local jobs.
