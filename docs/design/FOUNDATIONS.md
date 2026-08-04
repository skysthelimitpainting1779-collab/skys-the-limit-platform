# Design Foundations Specification — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** Core design system principles, color palette, grid layout, elevation, border geometry, and asset guidelines for Sky's the Limit Painting LLC.

---

## 1. Core Visual Principles

1. **Craftsman Precision & Prep-First Execution:**
   The design mirrors Sky's the Limit's commercial painting discipline: structured, high-legibility, clean layout grids, and meticulous attention to visual detail.

2. **High-Contrast Professional Trust:**
   Utilitarian clarity paired with premium polish. High contrast ensures readability in full sunlight for field crews on mobile devices and clean elegance for commercial property owners on desktop screens.

3. **Anti-Slop Visual Discipline:**
   Generic, low-quality stock photography or AI-generated contractor tropes are strictly banned. All visuals showcase genuine craftsmanship, real project prep, and verified crew work.

---

## 2. Color System Foundations

### 2.1 Brand & Accent Palette
- **Sky's Orange (Primary Accent):** `#E65100` (`hsl(21, 100%, 45%)`)
  - Hover / Active State: `#CC4400` (`hsl(21, 100%, 40%)`)
  - Light Accent Surface: `#FFF3E0` (`hsl(21, 100%, 94%)`)
- **Deep Slate / Charcoal (Base Dark Surface):** `#1E293B` (`hsl(215, 28%, 17%)`)
- **Charcoal Heading / Primary Text:** `#0F172A` (`hsl(222, 47%, 11%)`)
- **Neutral Light Surface:** `#F8FAFC` (`hsl(210, 40%, 98%)`)
- **Card / Container Background:** `#FFFFFF` (`hsl(0, 0%, 100%)`)

### 2.2 Semantic & Status Colors
- **Success (Completed / Approved):** `#166534` (`hsl(142, 64%, 24%)`) / Surface: `#DCFCE7`
- **Warning (In Progress / Pending Review):** `#B45309` (`hsl(38, 92%, 37%)`) / Surface: `#FEF3C7`
- **Destructive / Alert (Action Required):** `#DC2626` (`hsl(0, 72%, 51%)`) / Surface: `#FEE2E2`
- **Info (Scheduled / Draft):** `#1D4ED8` (`hsl(224, 76%, 48%)`) / Surface: `#DBEAFE`

### 2.3 WCAG 2.2 AA Compliance Matrix
- Text contrast against background surfaces must achieve at least **4.5:1** for standard body text and **3.0:1** for large headings (18pt+ / 14pt bold).
- Interactive elements must maintain **3.0:1** contrast for focus indicators and border states.

---

## 3. Spacing & Grid System

### 3.1 4px Baseline Scale
All layout spacing, margins, padding, and component heights adhere to a strict 4px / 8px incremental scale:
- `space-1` (4px)
- `space-2` (8px)
- `space-3` (12px)
- `space-4` (16px)
- `space-6` (24px)
- `space-8` (32px)
- `space-12` (48px)
- `space-16` (64px)
- `space-24` (96px)

### 3.2 Responsive Container Breakpoints
- **Mobile (`sm`):** 640px (Padding: `px-4`)
- **Tablet (`md`):** 768px (Padding: `px-6`)
- **Laptop (`lg`):** 1024px (Padding: `px-8`)
- **Desktop (`xl`):** 1280px (Container Max-Width: `1200px`)
- **Ultra-Wide (`2xl`):** 1536px (Container Max-Width: `1400px`)

---

## 4. Elevation, Shadow & Geometry

### 4.1 Border Radius Standards
- **Buttons / Badges:** `rounded-md` (6px)
- **Cards / Containers / Modals:** `rounded-lg` (8px / `0.5rem`)
- **Floating Controls / Tooltips:** `rounded-full` (9999px)

### 4.2 Elevation Layers
- **Level 0 (Flat):** `border border-slate-200 bg-white`
- **Level 1 (Card Hover / Dropdown):** `shadow-sm` (`0 1px 2px 0 rgb(0 0 0 / 0.05)`)
- **Level 2 (Modals / Popovers):** `shadow-md` (`0 4px 6px -1px rgb(0 0 0 / 0.1)`)
- **Level 3 (Sticky Headers / Floating Action Bars):** `shadow-lg` (`0 10px 15px -3px rgb(0 0 0 / 0.1)`)

---

## 5. Photography & Visual Asset Policy

1. **Authentic Project Imagery Only:**
   Images must depict actual Sky's the Limit prep work, commercial painting, residential exterior/interior transformations, and crew operations.
2. **Before / After Presentation:**
   Comparisons must use consistent lighting, angle framing, and high-resolution captures.
3. **Asset Optimization:**
   All images served via Next.js `<Image />` component with Next.js image optimization, responsive `sizes`, WebP/AVIF formatting, and explicit `width`/`height` aspects.
