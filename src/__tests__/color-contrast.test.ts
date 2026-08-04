import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type Oklch = [number, number, number];

function token(block: string, name: string): Oklch {
  const match = block.match(
    new RegExp(`--${name}:\\s*oklch\\(([-.\\d]+)\\s+([-.\\d]+)\\s+([-.\\d]+)\\)`),
  );
  if (!match) throw new Error(`Missing opaque OKLCH token: ${name}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function linearRgb([lightness, chroma, hue]: Oklch) {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const l0 = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const m0 = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const s0 = lightness - 0.0894841775 * a - 1.291485548 * b;
  const l = l0 ** 3;
  const m = m0 ** 3;
  const s = s0 ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((channel) => Math.max(0, Math.min(1, channel)));
}

function luminance(color: Oklch) {
  const [red, green, blue] = linearRgb(color);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: Oklch, second: Oklch) {
  const values = [luminance(first), luminance(second)].sort(
    (left, right) => right - left,
  );
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("design-token contrast", () => {
  const css = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");
  const light = css.slice(css.indexOf(":root"), css.indexOf("@theme"));
  const dark = css.slice(css.indexOf("@media (prefers-color-scheme: dark)"));

  it("keeps normal primary action text at WCAG AA contrast", () => {
    expect(contrast(token(light, "primary"), token(light, "primary-foreground"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "primary"), token(dark, "primary-foreground"))).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps primary-colored normal text legible on the page background", () => {
    expect(contrast(token(light, "primary"), token(light, "background"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token(dark, "primary"), token(dark, "background"))).toBeGreaterThanOrEqual(4.5);
  });
});
