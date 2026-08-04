# Authentication Context & Contract (WorkOS AuthKit vs Clerk)

- **Research Date**: 2026-07-31
- **Official Source**: Context7 `/get-convex/convex-auth` & Provider Docs
- **Selected Version / Contract**: WorkOS AuthKit (Selected for clean organization isolation, MFA, and cost model)
- **Decision Affected**: Identity provider, JWT verification in Convex, user onboarding flows.
- **Important Constraints**:
  - Invitation-only staff access for operations/crew portals.
  - Invitation-only customer identity followed by an audited, exact Convex customer binding.
  - AuthKit authenticates identities; active Convex organization memberships and object bindings authorize access.
  - Isolated Preview credentials from Production environment.
