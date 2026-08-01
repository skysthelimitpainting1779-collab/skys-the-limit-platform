import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";

describe("UI and utility verification", () => {
  it("merges Tailwind classes without retaining overridden spacing", () => {
    const result = cn("px-2 py-1", "bg-red-500", "px-4");
    expect(result).toContain("px-4");
    expect(result).toContain("py-1");
    expect(result).toContain("bg-red-500");
    expect(result).not.toContain("px-2");
  });

  it("uses semantic design tokens for button variants", () => {
    const defaultButton = buttonVariants({ variant: "default" });
    const secondaryButton = buttonVariants({ variant: "secondary" });
    const largeButton = buttonVariants({ size: "lg" });

    expect(defaultButton).toContain("bg-primary");
    expect(defaultButton).toContain("text-primary-foreground");
    expect(defaultButton).not.toMatch(/#[0-9a-f]{3,8}/i);
    expect(secondaryButton).toContain("bg-secondary");
    expect(largeButton).toContain("h-12");
  });

  it("uses semantic brand tokens for badges", () => {
    const brandBadge = badgeVariants({ variant: "brand" });
    expect(brandBadge).toContain("bg-primary");
    expect(brandBadge).toContain("text-primary-foreground");
    expect(brandBadge).not.toMatch(/#[0-9a-f]{3,8}/i);
  });
});
