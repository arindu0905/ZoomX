import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink, buttonClasses } from "@/components/ui/button";

describe("Button", () => {
  it("defaults to type=button so it never submits forms by accident", () => {
    render(<Button>Add</Button>);
    expect(screen.getByRole("button", { name: "Add" })).toHaveAttribute("type", "button");
  });

  it("renders links with square Shopify-style buttons", () => {
    render(<ButtonLink href="/shop">Shop</ButtonLink>);
    const link = screen.getByRole("link", { name: "Shop" });
    expect(link).toHaveAttribute("href", "/shop");
    expect(link.className).toContain("rounded-none");
  });

  it("omits size padding for the link variant", () => {
    expect(buttonClasses({ variant: "link" })).not.toContain("px-7");
    expect(buttonClasses({ variant: "primary", size: "lg" })).toContain("min-h-[3.25rem]");
  });
});
