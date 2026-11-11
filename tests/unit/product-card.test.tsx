import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCard } from "@/components/products/product-card";
import type { StoreProduct } from "@/types/store-api";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

const base: StoreProduct = {
  id: 1,
  name: "Dish Wash &#8211; 500ml",
  slug: "dish-wash-500ml",
  type: "simple",
  short_description: "",
  on_sale: false,
  prices: {
    price: "45000",
    regular_price: "45000",
    sale_price: "45000",
    currency_code: "LKR",
    currency_minor_unit: 2,
    price_range: null,
  },
  images: [{ id: 9, src: "https://zoomx.lk/wp-content/uploads/a.webp", alt: "" }],
  categories: [],
  is_in_stock: true,
  is_purchasable: true,
  has_options: false,
  average_rating: "0",
  review_count: 0,
};

describe("ProductCard", () => {
  it("links to the product and decodes the name as text", () => {
    render(<ProductCard product={base} />);
    const link = screen.getByRole("link", { name: "Dish Wash – 500ml" });
    expect(link).toHaveAttribute("href", "/product/dish-wash-500ml");
    expect(screen.getByRole("img")).toHaveAttribute("alt", "Dish Wash – 500ml");
    expect(screen.getByText("LKR 450.00")).toBeInTheDocument();
  });

  it("shows WooCommerce sale and regular prices without computing them", () => {
    render(
      <ProductCard
        product={{ ...base, on_sale: true, prices: { ...base.prices, price: "40000", sale_price: "40000" } }}
      />,
    );
    expect(screen.getByText("Sale")).toBeInTheDocument();
    expect(screen.getByText("LKR 400.00")).toBeInTheDocument();
    expect(screen.getByText("LKR 450.00").closest("s")).not.toBeNull();
  });

  it("only shows a rating when genuine reviews exist", () => {
    const { rerender } = render(<ProductCard product={{ ...base, average_rating: "4.5", review_count: 0 }} />);
    expect(screen.queryByText(/out of 5/)).toBeNull();
    rerender(<ProductCard product={{ ...base, average_rating: "4.5", review_count: 12 }} />);
    expect(screen.getByText(/out of 5/)).toBeInTheDocument();
  });

  it("flags out-of-stock products and hides the sale badge", () => {
    render(<ProductCard product={{ ...base, is_in_stock: false, on_sale: true }} />);
    expect(screen.getByText("Sold out")).toBeInTheDocument();
    expect(screen.queryByText("Sale")).toBeNull();
  });
});
