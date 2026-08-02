# Typography Specification — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** Typography hierarchy, font stacks, line lengths, responsive scales, and readability rules.

---

## 1. Font Family & Stack

The platform utilizes **Inter** as the primary font family for clean legibility, geometric precision, and modern UI presentation.

```css
font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
```

---

## 2. Type Scale & Hierarchy

| Role | Class / Token | Desktop Size / Line-Height | Mobile Size / Line-Height | Font Weight | Letter Spacing |
|---|---|---|---|---|---|
| **Display Hero** | `text-4xl lg:text-6xl` | 60px / 1.1 (66px) | 36px / 1.15 (41px) | 800 (ExtraBold) | `-0.025em` (Tight) |
| **Heading 1 (H1)** | `text-3xl lg:text-4xl` | 36px / 1.2 (43px) | 28px / 1.25 (35px) | 700 (Bold) | `-0.02em` |
| **Heading 2 (H2)** | `text-2xl lg:text-3xl` | 30px / 1.25 (37px) | 24px / 1.3 (31px) | 700 (Bold) | `-0.015em` |
| **Heading 3 (H3)** | `text-xl lg:text-2xl` | 24px / 1.3 (31px) | 20px / 1.35 (27px) | 600 (SemiBold) | `-0.01em` |
| **Heading 4 (H4)** | `text-lg lg:text-xl` | 20px / 1.4 (28px) | 18px / 1.4 (25px) | 600 (SemiBold) | `normal` |
| **Subheading** | `text-base lg:text-lg` | 18px / 1.5 (27px) | 16px / 1.5 (24px) | 500 (Medium) | `normal` |
| **Body (Default)** | `text-base` | 16px / 1.625 (26px) | 15px / 1.6 (24px) | 400 (Regular) | `normal` |
| **Body Small** | `text-sm` | 14px / 1.5 (21px) | 14px / 1.5 (21px) | 400 / 500 | `normal` |
| **Caption / Badge** | `text-xs uppercase` | 12px / 1.4 (17px) | 12px / 1.4 (17px) | 600 (SemiBold) | `0.05em` (Wide) |

---

## 3. Readability & Line Length Rules

1. **Max Line-Length Constraint (`max-w-prose`):**
   Body text paragraphs must never exceed **65 to 75 characters per line** (`max-w-2xl` / `65ch`). Wide multi-line text wraps impair reading comprehension.

2. **No 6-Line Paragraph Wraps:**
   Break long body text blocks into digestible 2-3 sentence paragraphs paired with clear H2/H3 section subheadings.

3. **Heading Contrast:**
   All headings use Charcoal `#0F172A` on light backgrounds and Pure White `#FFFFFF` on dark slate surfaces.

4. **Numeric Legibility:**
   Use tabular numbers (`font-mono` / `tabular-nums`) for currency values, estimates, square footages, and table metrics.
