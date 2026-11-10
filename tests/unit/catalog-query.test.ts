import { describe, expect, it } from "vitest";
import { parseCatalogQuery, toSearchString, toStoreApiParams } from "@/lib/catalog-query";

describe("parseCatalogQuery", () => {
  it("defaults to featured order, page 1", () => {
    expect(parseCatalogQuery({})).toEqual({ sort: "default", page: 1 });
  });

  it("parses valid values", () => {
    expect(
      parseCatalogQuery({
        search: "  floor ",
        sort: "price-asc",
        min: "500",
        max: "900",
        page: "2",
        category: "kitchen",
      }),
    ).toEqual({
      search: "floor",
      sort: "price-asc",
      min: 500,
      max: 900,
      page: 2,
      category: "kitchen",
    });
  });

  it("ignores malformed values instead of throwing", () => {
    expect(
      parseCatalogQuery({
        sort: "hack",
        min: "-5",
        max: "abc",
        page: "0",
        category: "../etc",
      }),
    ).toEqual({ sort: "default", page: 1 });
  });

  it("swaps an inverted price range and takes the first repeated value", () => {
    expect(
      parseCatalogQuery({
        min: "900",
        max: "500",
        sort: ["newest", "price-asc"],
      }),
    ).toMatchObject({
      min: 500,
      max: 900,
      sort: "newest",
    });
  });

  it("treats empty price fields as unset (not zero)", () => {
    expect(parseCatalogQuery({ min: "", max: " " })).toEqual({
      sort: "default",
      page: 1,
    });
  });

  it("caps search length", () => {
    expect(parseCatalogQuery({ search: "x".repeat(500) }).search).toHaveLength(100);
  });
});

describe("toStoreApiParams", () => {
  it("maps sort and converts rupees to minor units", () => {
    expect(
      toStoreApiParams({
        sort: "price-desc",
        page: 3,
        min: 500,
        max: 900,
        search: "dish",
      }),
    ).toEqual({
      orderby: "price",
      order: "desc",
      page: 3,
      per_page: 12,
      search: "dish",
      min_price: 50000,
      max_price: 90000,
    });
  });
});

describe("toSearchString", () => {
  it("omits defaults", () => {
    expect(toSearchString({ sort: "default", page: 1 })).toBe("");
    expect(toSearchString({ sort: "newest", page: 2, search: "a b" })).toBe("?search=a+b&sort=newest&page=2");
  });
});
