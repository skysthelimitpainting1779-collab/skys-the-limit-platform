## 2026-08-01T19:08:30Z
You are worker_v4_005. Your working directory is C:\Users\Johnny Cage\Documents\antigravity\skys-the-limit-platform\.agents\worker_v4_005\

### Objective
Execute Node V4-005: Convex CMS Schema & Infrastructure.

### Scope & Tasks
1. Extend `convex/schema.ts` with typed CMS tables:
   - `siteSettings`: site info, contact details, active announcement banner.
   - `navigationItems`: header/footer/sidebar navigation items with target roles.
   - `cmsPages`: page status ("draft" | "in_review" | "published"), versioning, author.
   - `cmsPageSections`: discriminated section types (`hero`, `transformation_slider`, `proof_grid`, `capability_matrix`, `process_timeline`, `cta_banner`, `text_content`).
   - `cmsRevisions`: snapshot history and change summary.
   - `services`: service catalog with category, features, proof asset links.
   - `proofAssets`: proof portfolio assets with permission status.
   - `projects`: completed case studies with before/after images and testimonials.
   - `faqs`: categorized Q&A pairs with audience targeting.
   - `legalPages`: privacy policy, terms, proof permission policies.
2. Implement typed CMS queries and mutations in `convex/cms.ts`: page creation, section edits, draft save, revision history snapshotting, publication control with claim gate integration, preview retrieval.
3. Add seed functions / initial default content for CMS tables in `convex/seedCms.ts`.
4. Add unit/integration tests for CMS functions.
5. Create state file `.agent/state/nodes/v4-005.json` recording evidence and status `pass`.
6. Write handoff report in `.agents\worker_v4_005\handoff.md`.
