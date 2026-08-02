# Vitest Unit & Component Testing — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/vitest-dev/vitest`
- **Version:** Vitest 1.6.x
- **Official Source:** https://vitest.dev
- **Decision Affected:** Unit testing, component testing, schema validation tests, and business logic verification.

## Key Contracts & Implementation Patterns

1. **Co-located Test Files:**
   - Place unit test files adjacent to target implementation modules (e.g. `utils.test.ts` co-located with `utils.ts`).

2. **Testing Library Integration:**
   - Test UI components using `@testing-library/react` inside a `jsdom` or `happy-dom` environment.
   - Test component behavior and accessibility assertions rather than implementation details.

3. **Mock Isolation & Reset:**
   - Clear and reset mocks before each test execution (`beforeEach(() => vi.clearAllMocks())`) to prevent cross-test contamination.

4. **Coverage & Snapshot Standards:**
   - Enforce branch coverage on core domain logic, validators, and utility helper functions.

5. **CI Execution:**
   - Integrated as the primary fast-feedback test suite (`npm test`) in continuous integration.
