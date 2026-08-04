# Playwright End-to-End Testing — Context7 Research Record

- **Research Date:** 2026-08-02
- **Library ID:** `/microsoft/playwright`
- **Version:** `@playwright/test` 1.45.x
- **Official Source:** https://playwright.dev
- **Decision Affected:** E2E browser tests, user flow verification, visual regression testing, and CI automated test execution.

## Key Contracts & Implementation Patterns

1. **User-Centric Locators:**
   - Locate elements using accessible roles, labels, and text: `page.getByRole()`, `page.getByLabel()`, `page.getByText()`.
   - Avoid brittle CSS or XPath selectors.

2. **Web-First Auto-Waiting Assertions:**
   - Rely on Playwright auto-waiting assertions (`await expect(locator).toBeVisible()`, `toBeEnabled()`, `toHaveText()`) to reduce test flakiness.

3. **Isolated Test Contexts:**
   - Each test runs in a clean browser context ensuring isolated storage, cookies, and session state.

4. **CI & Artifact Strategy:**
   - Run tests in headless mode in CI pipelines.
   - Retain traces, screenshots, and videos on test failures for root-cause analysis.

5. **Preview URL Verification:**
   - E2E test suite targets Vercel Git Preview URLs dynamically during PR checks.
