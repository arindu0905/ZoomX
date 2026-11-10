import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SiteFooter } from "@/components/layout/site-footer";
import { site } from "@/lib/site";

vi.mock("@/components/ui/logo", () => ({ Logo: () => <span>ZOOM X home</span> }));

describe("SiteFooter", () => {
  it("shows the real contact details from zoomx.lk", () => {
    render(<SiteFooter />);
    expect(screen.getByText(site.contact.office)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: site.contact.phone })).toHaveAttribute("href", "tel:+94777878667");
  });

  it("hides unknown business details instead of inventing them", () => {
    render(<SiteFooter />);
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(screen.queryByRole("link", { name: "Facebook" })).toBeNull();
  });
});
