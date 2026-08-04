# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary users are Sky's the Limit Painting's owner and invited staff: administrators, estimators, project managers, content editors and approvers, crew leads, and crew members. They use the product to move work from inbound request through estimating, scheduling, field execution, documentation, and closeout. Invited customers are a secondary audience with access only to records explicitly bound to their authenticated account.

## Product Purpose

The platform is the operating system for Sky's the Limit Painting: a public proof-and-intake experience connected to a secure internal workspace and customer project record. Success means a real request can enter Convex once, authorized staff can advance it without spreadsheet handoffs, crew can execute from a phone, and every sensitive action remains attributable and tenant-scoped.

## Positioning

Public proof, sales intake, project operations, field verification, controlled documents, and publication governance share one source of truth instead of being split across a generic contractor website and disconnected back-office tools.

## Operating Context

Owner and staff work from desktop and mobile throughout the day. Estimators qualify leads and prepare estimates; project managers schedule jobs and crews; field users complete prep and closeout checklists and upload project evidence; authorized content staff manage publishable proof; owners and administrators review notifications and immutable audit history. WorkOS supplies authenticated identity and organization context. Convex owns authorization and operational state. Vercel Blob owns public and private file bytes.

## Capabilities and Constraints

- Public visitors may read published content and submit bounded project-fit requests; no other business RPC is anonymous.
- Protected functions authenticate independently and derive the actor from the WorkOS token identifier.
- Organization membership, lifecycle, role, customer binding, and crew assignment are enforced at the Convex boundary.
- Owner and staff access is invitation-only. Customer access requires an explicit immutable account binding; email addresses and record IDs are never ownership proof.
- Preview and Staging use isolated WorkOS, Convex, and Blob credentials. Production configuration, data, domains, billing, messaging, and deployment require explicit owner approval.
- Operational state lives only in Convex. File bytes live only in Vercel Blob; Convex stores file metadata and authorization state.
- Live email, payments, AI, and durable external workflows remain dormant until separately approved and configured.

## Brand Commitments

The product name is Sky's the Limit Painting LLC. The voice is direct, trustworthy, prep-first, safety-conscious, and locally accountable. Only authentic approved owner, crew, and project evidence may be presented as real; generic contractor stock and fabricated proof are prohibited.

## Evidence on Hand

The repository contains the public-site copy, architecture and authorization contracts, approved design foundations, source-pack receipt, claims/proof governance models, and automated security and route tests. Production credentials, live customer data, and permission to activate external effects are not evidence on hand and must not be fabricated.

## Product Principles

1. One job record, one accountable source of truth.
2. Authorization is enforced where data is read or changed, never inferred from page visibility.
3. Every visible control completes a real workflow or is omitted.
4. Field work must remain fast, legible, and recoverable on a phone.
5. Claims, uploads, approvals, and role changes remain attributable and reviewable.

## Accessibility & Inclusion

All product surfaces target WCAG 2.2 AA, full keyboard operation, visible focus, reduced-motion support, readable status language, and mobile layouts usable in bright field conditions.
