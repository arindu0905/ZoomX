import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/layout/site-header";
import { useUiStore } from "@/store/ui";
import { useCartStore } from "@/store/cart";

vi.mock("next/navigation", () => ({ usePathname: () => "/shop" }));
vi.mock("@/components/ui/logo", () => ({ Logo: () => <span>ZOOM X home</span> }));

const categories = [{ name: "Laundry Care", slug: "laundry-care" }];

describe("SiteHeader", () => {
  beforeEach(() =>
    act(() => {
      useUiStore.setState({ panel: null });
      useCartStore.setState({ cart: null });
    }),
  );

  it("marks the current route", () => {
    render(<SiteHeader categories={categories} />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    expect(nav.querySelector('a[href="/shop"]')).toHaveAttribute("aria-current", "page");
    expect(nav.querySelector('a[href="/"][aria-current]')).toBeNull();
  });

  it("announces the bag count accessibly", () => {
    render(<SiteHeader categories={[]} />);
    expect(screen.getByRole("link", { name: "Shopping bag" })).toBeInTheDocument();
    act(() => useCartStore.setState({ cart: { items_count: 3 } as never }));
    expect(screen.getByRole("link", { name: "Shopping bag, 3 items" })).toBeInTheDocument();
  });

  it("opens the categories flyout with real categories and closes on Escape", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={categories} />);
    const trigger = screen.getByRole("button", { name: "Categories" });

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const dialog = screen.getByRole("dialog", { name: "Shop by category" });
    expect(dialog.querySelector('a[href="/category/laundry-care"]')).toHaveTextContent("Laundry Care");

    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("search is a GET form to /shop so it works without JavaScript", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={[]} />);
    await user.click(screen.getByRole("button", { name: "Search products" }));
    const input = await screen.findByRole("searchbox", { name: "Search ZOOM X products" });
    const form = input.closest("form")!;
    expect(form).toHaveAttribute("action", "/shop");
    expect(form).toHaveAttribute("method", "get");
    expect(input).toHaveAttribute("name", "search");
  });

  it("only one panel is open at a time", async () => {
    const user = userEvent.setup();
    render(<SiteHeader categories={[]} />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(useUiStore.getState().panel).toBe("menu");
    act(() => useUiStore.getState().open("search"));
    expect(useUiStore.getState().panel).toBe("search");
  });
});
