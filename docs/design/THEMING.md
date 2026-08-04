# Theming & CSS Variable Tokens Specification — Sky's the Limit Platform

- **Document Version:** 1.0.0
- **Last Updated:** 2026-08-02
- **Scope:** CSS variables architecture, Tailwind CSS v4 theme mappings, light/dark mode execution, and portal branding.

---

## 1. CSS Variable Architecture

All theme colors and design tokens are declared as HSL variables in `src/app/globals.css`, supporting clean runtime switching and Tailwind CSS v4 variable mapping.

### 1.1 Light Mode Token Definitions (Default)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;

  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;

  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;

  /* Primary Accent: Sky's Orange */
  --primary: 21 100% 45%;
  --primary-foreground: 0 0% 100%;

  /* Secondary Neutral */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;

  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;

  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;

  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;

  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 21 100% 45%;

  --radius: 0.5rem;
}
```

### 1.2 Dark Mode Token Definitions (`.dark` class)
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;

  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;

  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;

  --primary: 21 100% 50%;
  --primary-foreground: 0 0% 100%;

  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;

  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;

  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;

  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;

  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 21 100% 50%;
}
```

---

## 2. Theme Provider & Hydration Safety

1. **Provider Setup (`next-themes`):**
   ```tsx
   import { ThemeProvider as NextThemesProvider } from "next-themes";

   export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
     return (
       <NextThemesProvider
         attribute="class"
         defaultTheme="system"
         enableSystem
         disableTransitionOnChange
         {...props}
       >
         {children}
       </NextThemesProvider>
     );
   }
   ```

2. **SSR Hydration Mismatch Prevention:**
   The `<html>` element includes `suppressHydrationWarning` to allow `next-themes` script injection without React hydration warnings.
   Theme toggle components wait for client mount before rendering active theme icons.

---

## 3. Portal Branding Scoping

- **Public Marketing Site & Customer Portal:** Default clean Light Mode with optional system toggle.
- **Operations & Field Admin Portals:** Dark Slate mode optimized for high contrast outdoors and high-density data dashboards.
