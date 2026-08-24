import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("seeded inaccessible control is detected", async ({ page }) => {
  await page.setContent("<!doctype html><html lang='en'><title>Seed</title><body><button></button></body></html>");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.some((violation) => violation.id === "button-name")).toBe(true);
});

for (const route of ["/", "/estimate"]) {
  test(`${route} has no serious accessibility or browser-console failures`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });

    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok(), `Expected ${route} to return a successful response`).toBe(true);
    await expect(page.locator("body")).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const blocking = results.violations.filter((violation) => violation.impact === "serious" || violation.impact === "critical");
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    expect(consoleErrors, consoleErrors.join("\n")).toEqual([]);
  });
}
