import { describe, expect, it } from "vitest";
import { decodeEntities, htmlToText } from "@/utils/text";

describe("decodeEntities", () => {
  it("decodes numeric, hex and named entities", () => {
    expect(decodeEntities("Dish Wash &#8211; 500ml")).toBe("Dish Wash – 500ml");
    expect(decodeEntities("Tom &amp; Jerry &#x2019;s")).toBe("Tom & Jerry ’s");
  });

  it("returns markup as inert text rather than HTML", () => {
    expect(decodeEntities("&lt;script&gt;")).toBe("<script>");
  });

  it("leaves unknown or invalid entities untouched", () => {
    expect(decodeEntities("&bogus; &#0;")).toBe("&bogus; &#0;");
  });
});

describe("htmlToText", () => {
  it("strips tags and collapses whitespace", () => {
    expect(htmlToText("<p>Gentle&nbsp;on <strong>hands</strong></p>\n")).toBe("Gentle on hands");
  });
});
