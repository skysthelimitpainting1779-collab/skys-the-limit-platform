import { describe, expect, it } from "vitest";
import {
  calculateTotal,
  computeTotalFromPricing,
} from "../../convex/estimates";

function handlerOf(registeredFunction: unknown) {
  return (registeredFunction as { _handler: unknown })._handler as (
    ctx: unknown,
    args: { pricing?: number | Record<string, unknown> },
  ) => Promise<number>;
}

describe("Convex pricing helpers", () => {
  it("returns an explicit numeric estimate total", () => {
    expect(computeTotalFromPricing(500)).toBe(500);
    expect(computeTotalFromPricing({ total: 1_250 })).toBe(1_250);
  });

  it("sums bounded item and line-value pricing shapes", () => {
    expect(
      computeTotalFromPricing({
        items: [{ amount: 100 }, { price: 200 }, 300],
      }),
    ).toBe(600);
    expect(
      computeTotalFromPricing({ labor: 400, materials: 600 }),
    ).toBe(1_000);
  });

  it("calculates only caller-provided pricing and never fetches an estimate", async () => {
    const handler = handlerOf(calculateTotal);

    await expect(handler({}, { pricing: 4_200 })).resolves.toBe(4_200);
    await expect(handler({}, {})).resolves.toBe(0);
  });
});
