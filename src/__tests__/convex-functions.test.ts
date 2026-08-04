import { describe, expect, it } from "vitest";
import { computeTotalFromPricing } from "../../convex/estimates";

describe("Convex pure pricing helper", () => {
  it("computes supported pricing representations without database access", () => {
    expect(computeTotalFromPricing(500)).toBe(500);
    expect(computeTotalFromPricing({ total: 1_250 })).toBe(1_250);
    expect(
      computeTotalFromPricing({
        items: [{ amount: 100 }, { price: 200 }, 300],
      }),
    ).toBe(600);
    expect(computeTotalFromPricing({ labor: 400, materials: 600 })).toBe(1_000);
  });
});
