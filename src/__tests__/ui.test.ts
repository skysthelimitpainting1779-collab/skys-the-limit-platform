import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { badgeVariants } from "@/components/ui/badge";

describe("UI & Utility Verification Suite", () => {
  it("merges tailwind class names correctly with cn helper", () => {
    const result = cn("px-2 py-1", "bg-red-500", "px-4");
    expect(result).toContain("px-4");
    expect(result).toContain("py-1");
    expect(result).toContain("bg-red-500");
    expect(result).not.toContain("px-2");
  });

  it("generates correct button variant class names", () => {
    const defaultBtn = buttonVariants({ variant: "default" });
    expect(defaultBtn).toContain("bg-[#E65100]");

    const secondaryBtn = buttonVariants({ variant: "secondary" });
    expect(secondaryBtn).toContain("bg-slate-100");

    const lgBtn = buttonVariants({ size: "lg" });
    expect(lgBtn).toContain("h-12");
  });

  it("generates correct badge variant class names", () => {
    const brandBadge = badgeVariants({ variant: "brand" });
    expect(brandBadge).toContain("bg-[#E65100]");
    expect(brandBadge).toContain("text-white");
  });
});
