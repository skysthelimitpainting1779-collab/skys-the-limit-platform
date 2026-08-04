# WorkOS Staging Bootstrap

Last verified: 2026-08-03

This runbook records the non-production AuthKit posture for the platform. It
contains no credentials. Production is deliberately excluded.

## Current Staging posture

- Self-service sign-up is disabled; access is invitation-only.
- MFA is required and email verification remains enabled.
- Dynamic client registration is disabled.
- Sessions expire after 30 days with a 12-hour inactivity timeout.
- Passwords require at least 14 characters, upper/lowercase, number, symbol,
  breached-password rejection, and five-entry history.
- Local AuthKit callback: `http://localhost:3000/auth/callback`.
- Local logout return: `http://localhost:3000`.
- Local allowed web origin: `http://localhost:3000`.
- No application webhook is registered until a verified Preview Convex HTTP
  endpoint exists.
- The disposable `Test Organization` is not an application tenant.

## Roles and permissions

The Staging environment defines Owner, Admin, Project Manager, Estimator,
Content Approver, Content Editor, Crew Lead, Crew Member, and an unprivileged
Member role. Coarse WorkOS permissions cover administration, operations, crew,
content, customer data, and estimates.

These roles are identity-provider evidence only. They never grant application
authority directly. Convex stores the active organization membership and role
used by every protected function. A newly synchronized WorkOS membership is
quarantined as Convex `member` until an audited administrator maps it.

## Preview activation sequence

1. Verify the rescue branch locally: hostile authorization tests, typecheck,
   production build, and anonymous browser smokes.
2. Push the reviewed branch and obtain its exact Vercel Preview URL.
3. Register that HTTPS callback, logout return, and web origin in Staging
   without removing localhost.
4. Provision an isolated Preview Convex deployment and configure only its
   Staging webhook secret, private Blob token, and a unique lead-intake proof
   secret shared with the matching Vercel Preview.
5. Register the official Convex AuthKit webhook endpoint at
   `https://<preview-deployment>.convex.site/workos/webhook` for user,
   organization, and organization-membership lifecycle events.
6. Send a sandbox test event and verify signature handling plus lifecycle
   synchronization.
7. Create the real Staging organization only after the webhook is live so its
   creation event cannot be missed.
8. Bootstrap the first Convex owner membership through a separately reviewed,
   audited administrative step. A WorkOS Owner slug alone is insufficient.
9. Invite real users only with explicit approval because invitations send
   external email.

Never reuse Staging credentials, organizations, webhooks, Blob stores, or
Convex deployments in Production.
