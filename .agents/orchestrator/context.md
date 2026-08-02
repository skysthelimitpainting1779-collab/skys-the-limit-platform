# Platform Architecture Context — Sky's Signature Operating Platform V4

## Platform Topology
- **Framework**: Next.js 16 App Router (React 19, TypeScript)
- **Backend & Database**: Convex (reactive server functions, real-time subscriptions, private file storage, crons)
- **Authentication**: WorkOS AuthKit (Staging environment, RBAC middleware, signed webhooks)
- **UI Primitives**: shadcn/ui (source-owned in `src/components/ui`), Tailwind CSS
- **Motion**: `motion/react` exclusively (in `src/design/motion`)
- **Hosting & Deployments**: Vercel Git Integration (`sky-s-the-limit-platform`, Preview deployments, noindex)

## User Roles & Authorization Hierarchy
1. `owner`: Full platform governance & emergency overrides
2. `admin`: Platform settings, user role management, system audits
3. `estimator`: Estimate creation, pricing models, proposal dispatch
4. `project_manager`: Operations overview, job scheduling, crew assignment
5. `content_editor`: CMS draft creation, section editing
6. `content_approver`: CMS revision review, claims approval, publication release
7. `crew_lead`: Crew shift management, checklist signoff, field photo updates
8. `crew_member`: Daily task viewing, shift clock-in/out, item checklist checkoff
9. `customer`: Project status tracking, document download, photo submission, proposal approval
10. `anonymous`: Public website browsing, 7-step intake form submission

## Local Source Pack Location
- ZIP Path: `<repo-parent>/.source/skys-signature-design-drive-pack.zip` (SHA256: `f73edca31da7202f2c992b39dfeba0ecf134e5d5f3044525b3de4e5d55e6da5d`)
- Extracted Destination: `<repo-parent>/.source/skys-signature-design-drive-pack/`
