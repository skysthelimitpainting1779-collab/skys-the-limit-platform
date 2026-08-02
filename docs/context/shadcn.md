# Shadcn UI Operating Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/shadcn/ui`
- **Official Source:** https://ui.shadcn.com
- **Decision Affected:** Primitive selection, accessible form composition, and portal layout shell.

## Key Contracts
1. **Source-Owned Code:** Components are added into `@/components/ui` and styled via Tailwind CSS v4 CSS variables.
2. **Form Composition Pattern:** Use `Field`, `FieldLabel`, `FieldDescription`, `FieldError` with `data-invalid` and `aria-invalid` bindings.
3. **Sidebar Architecture:** Use `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarGroup`, `SidebarMenu`, `SidebarMenuButton`, `SidebarInset`, and `SidebarTrigger` for portal shells.
4. **Semantic Color Tokens:** Use `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-primary`. Never hardcode raw color classes.
