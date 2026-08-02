# Design Component Specifications — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** UI Component Specifications, primitive variants, layout components, and accessibility interactions.

---

## 1. Core Component Primitives (`src/components/ui/`)

### 1.1 Button (`src/components/ui/button.tsx`)
- **Variants:**
  - `default`: Primary Sky's Orange (`bg-[#E65100] text-white hover:bg-[#CC4400]`)
  - `secondary`: Slate Surface (`bg-slate-100 text-slate-900 hover:bg-slate-200`)
  - `outline`: Bordered Slate (`border border-slate-300 bg-transparent text-slate-800 hover:bg-slate-50`)
  - `destructive`: Red Alert (`bg-red-600 text-white hover:bg-red-700`)
  - `ghost`: Transparent (`hover:bg-slate-100 text-slate-700`)
- **Sizes:**
  - `sm`: Height 36px (`px-3 py-1.5 text-sm`)
  - `md` (default): Height 40px (`px-4 py-2 text-sm`)
  - `lg`: Height 48px (`px-6 py-3 text-base`)
- **State Specifications:** Must include focus ring (`focus-visible:ring-2 focus-visible:ring-[#E65100]`), disabled state (`disabled:opacity-50 disabled:cursor-not-allowed`), and loading spinner state.

### 1.2 Card (`src/components/ui/card.tsx`)
- **Structure:** `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardDescription>`, `<CardContent>`, `<CardFooter>`
- **Style:** `bg-white border border-slate-200 rounded-lg shadow-sm`
- **Interactive Card Variant:** Includes subtle hover lift transition (`hover:border-slate-300 hover:shadow transition-all duration-200`).

### 1.3 Badge (`src/components/ui/badge.tsx`)
- **Variants:**
  - `default`: Sky Orange (`bg-[#E65100]/10 text-[#E65100] border border-[#E65100]/20`)
  - `success`: Green (`bg-emerald-50 text-emerald-700 border border-emerald-200`)
  - `warning`: Amber (`bg-amber-50 text-amber-700 border border-amber-200`)
  - `outline`: Slate outline (`border border-slate-300 text-slate-700`)

### 1.4 Dialog & Sheet (`src/components/ui/dialog.tsx`, `sheet.tsx`)
- **Dialog (Modal):** Overlay backdrop (`bg-black/60 backdrop-blur-sm`). Centered popover container (`max-w-lg w-full bg-white rounded-lg p-6`).
- **Sheet (Drawer):** Mobile navigation drawer or side panel sliding from right/left with spring dynamics (`motion/react`).
- **Accessibility:** Escape key dismissal, body scroll lock, focus trap inside dialog.

### 1.5 Table (`src/components/ui/table.tsx`)
- Integrated with TanStack Table.
- Standardized header row (`bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider`).
- Alternating row zebra striping option (`even:bg-slate-50/50 hover:bg-slate-100/60`).

---

## 2. Platform Layout & Domain Components

### 2.1 Navigation Header (`src/components/layout/Header.tsx`)
- Sticky top navigation bar (`sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200`).
- Displays brand logo, main navigation links, quick call CTA button, and customer portal sign-in button.
- Mobile burger menu toggles responsive Sheet overlay.

### 2.2 Lead Intake / Estimate Calculator Component (`src/components/marketing/EstimateCalculator.tsx`)
- Multi-step wizard supporting project type selection (Residential, Commercial, Exterior, Interior), square footage estimation, and contact info capture.
- Real-time client validation via Zod schemas.

### 2.3 Job Status Card (`src/components/portal/JobCard.tsx`)
- Displays current job state badge (Scheduled, Surface Prep, Painting, Final Inspection, Complete).
- Visual progress bar, assigned crew lead, scheduled inspection date, and site photo preview gallery.

---

## 3. Component Interaction & State Guidelines

1. **Loading Skeletons:**
   All async data-fetching components render `<Skeleton />` pulse shapes matching the target component geometry while data loads.
2. **Error States:**
   Form fields display inline red error messages (`text-red-600 text-xs mt-1`) with `aria-invalid="true"`.
3. **Empty States:**
   Tables or card lists with zero results display a centered empty state card with icon, title, message, and reset filter action button.
