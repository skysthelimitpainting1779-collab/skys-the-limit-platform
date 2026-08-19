# shadcn Component Manifest

## Current-state decision

The destination platform is the canonical frontend. The production website is a visual and behavioral reference, not a directory to copy. Both repositories contain overlapping primitives and different generations of component conventions. The platform will standardize on current shadcn/ui conventions, Tailwind CSS, Motion, Lucide or approved extracted icons, and semantic Sky’s the Limit tokens. Base UI-compatible primitives are used only where the current shadcn component supports them.

## Canonical source tree

```text
src/components/
  ui/          # canonical primitives only
  public/      # public content composition
  marketing/   # marketing sections and conversion shells
  forms/       # public and authenticated forms
  operations/  # staff/owner operation surfaces
  customer/    # customer portal
  crew/        # crew portal
  municipal/   # municipal pipeline
  cms/         # editorial/admin UI
  crm/         # CRM views
  providers/   # framework, auth, and Convex providers
```

## Primitive manifest

| Primitive | Current platform state | Decision | Target requirement |
|---|---|---|---|
| Button | Exists | MERGE | Standard variants, loading/disabled states, accessible focus. |
| Badge | Exists | MERGE | Semantic status variants; no business-specific colors in primitive. |
| Card | Exists | MERGE | Shared surface spacing and hierarchy tokens. |
| Input | Exists | MERGE | Accessible errors, descriptions, and form integration. |
| Textarea | Missing | ADD | Canonical field primitive. |
| Field/Label | Partial | REIMPLEMENT | Current shadcn composition and error semantics. |
| Select | Missing | ADD | Keyboard-accessible canonical select. |
| Dialog | Exists | MERGE | Focus trapping and destructive-action semantics. |
| Sheet/Drawer | Missing | ADD when responsive navigation/operations needs it | Use only when supported interaction exists. |
| Tabs | Missing | ADD | Record-area navigation and CMS editing. |
| Table/Data table | Missing | ADD | Operations, CRM, municipal lists with empty/loading states. |
| Dropdown menu | Missing | ADD | Authorized contextual actions only. |
| Command | Missing | DEFER | Add only when real global search/action requirements exist. |
| Calendar/Popover | Missing | ADD | Scheduling, deadline, and date filters. |
| Progress | Missing | ADD | Intake and workflow state, not fake progress. |
| Separator | Missing | ADD | Token-aligned layout primitive. |
| Toggle | Missing | ADD | Accessible binary preference controls. |
| Toast/Sonner | Missing | ADD | Non-sensitive feedback; errors must remain visible in forms. |
| Sidebar/navigation | Partial | REIMPLEMENT | Role-aware navigation from server-provided authorization context. |

## Component classification rules

| Classification | Meaning | Required evidence before action |
|---|---|---|
| MIGRATE | A verified user-visible component maps to a canonical platform area with compatible behavior | Import graph, screenshot/behavior spec, accessibility check |
| REIMPLEMENT | The user-visible behavior is valuable but implementation does not match target standards | Route/component specification and tests |
| MERGE | Multiple primitives represent the same function and can consolidate without lost behavior | Duplicate analysis and consumer migration plan |
| DELETE | Proven dead or duplicate component | Import/reference graph and test/route verification |
| ARCHIVE | Valuable historical reference not shipped | Documented archive location and no build dependency |
| UNKNOWN | Purpose or references not yet proven | No deletion permitted |

## Token direction

Tokens capture purpose, not a screenshot literal. The first foundation slice defines backgrounds, text levels, borders, surface elevations, brand accent, success/warning/error states, spacing, radius, shadows, typography scale, and motion duration/easing. The production site’s orange, dark-surface, strong contrast, prep-first visual language, and owner-led hierarchy guide the semantic tokens, but existing CSS is not copied without review.

Motion must honor reduced-motion preferences. Public visual effects are progressive enhancement and cannot hide content, navigation, or form completion. Form and portal components prioritize clarity, focus state, validation, and low-friction completion over decorative motion.

## Migration guardrails

No component moves until its imports, route consumers, and behavioral value are understood. The platform avoids an all-at-once `components/ui` replacement. Each primitive or family moves in a focused branch with tests and can be independently reverted. Public and privileged UI actions are rendered from server-authorized data; hiding a button is never a substitute for Convex authorization.

## Verification

Every component slice includes typecheck, unit/interaction tests, keyboard navigation, visible focus, responsive behavior, reduced-motion behavior, and a visual comparison for affected public routes. Critical form components include validation and submission failure states. Operations components include empty, loading, error, and unauthorized states.
