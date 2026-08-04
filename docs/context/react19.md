# React 19 Contract — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/facebook/react`
- **Version:** React 19.0.0+
- **Official Source:** https://react.dev
- **Decision Affected:** Component composition, Server/Client component boundaries, form action handling, and state transitions.

## Key Contracts & Implementation Patterns

1. **Server Components by Default:**
   - All components in the Next.js App Router render on the server by default.
   - Interactive components using hooks (`useState`, `useEffect`, event handlers) must explicitly declare `'use client'` at the top of the file.

2. **Ref as a Standard Prop:**
   - In React 19, `ref` is passed as a regular prop to function components. `forwardRef` is legacy and deprecated in favor of direct prop passing.

3. **Form Actions and State Hooks:**
   - Form handling utilizes `useActionState` for managing state from server actions.
   - `useFormStatus` tracks pending states within child components of forms.
   - `useOptimistic` manages optimistic UI updates during async mutations.

4. **Resource and Promise Handling:**
   - The `use()` API reads promises and context dynamically inside render functions without hook placement restrictions.

5. **Transition API (`useTransition`):**
   - Async functions are supported directly inside `startTransition` for non-blocking state updates and automatic pending state tracking.
