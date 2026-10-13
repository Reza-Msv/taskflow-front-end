import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn utility", () => {
  it("merges standard class names correctly", () => {
    const result = cn("p-4", "text-sm", "bg-white");
    expect(result).toBe("p-4 text-sm bg-white");
  });

  it("handles tailwind class conflicts with precedence", () => {
    const result = cn("p-4", "p-8");
    expect(result).toBe("p-8");
  });

  it("ignores falsy conditional values", () => {
    const isHidden = false;
    const isPrimary = true;
    const result = cn(
      "base-class",
      isHidden && "hidden",
      isPrimary && "text-primary"
    );
    expect(result).toBe("base-class text-primary");
  });
});
