import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";

describe("Button", () => {
  it("defaults to type=button so it never submits forms by accident", () => {
    render(<Button>Add</Button>);
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute("type", "button");
  });

  it("renders links with pill styling", () => {
    render(<ButtonLink href="/shop">Shop</ButtonLink>);
    const link = screen.getByRole("link", { name: "Shop" });
    expect(link).toHaveAttribute("href", "/shop");
    expect(link.className).toContain("rounded-full");
  });

  it("omits size padding for the link variant", () => {
    expect(buttonClasses({ variant: "link" })).not.toContain("px-6");
    expect(buttonClasses({ variant: "primary", size: "lg" })).toContain("h-14");
  });
});
