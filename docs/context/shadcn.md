# shadcn/ui Design System — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/shadcn/ui`
- **Version:** Tailwind CSS v4 + Radix UI + Lucide React
- **Official Source:** https://ui.shadcn.com
- **Decision Affected:** UI component primitives (`src/components/ui`).

## Key Contracts & Implementation Patterns

1. **Source-Owned Architecture:**
   - All primitive components are copied directly into `src/components/ui` and maintained within the source tree.
   - Utility class merging is centralized via `cn(...)` in `src/lib/utils.ts`.

2. **Tailwind CSS v4 Integration:**
   - Uses CSS variable tokens defined in theme stylesheets (`--background`, `--foreground`, `--primary`, etc.).
   - Dark mode toggle powered by `next-themes` with `class` strategy.

3. **Accessibility & Keyboard Navigation:**
   - Built on Radix UI primitives ensuring focus management, ARIA roles, and keyboard shortcuts out of the box.
   - All interactive controls enforce WCAG 2.2 AA contrast rules.

4. **Component Composition:**
   - Components export modular primitives (e.g. `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) for flexible layouts.
