import { NextResponse, type NextRequest } from "next/server";
import { searchProducts } from "@/services/woocommerce/catalog";
import type { SearchSuggestion } from "@/types/search";
import { formatPrice } from "@/utils/currency";
import { decodeEntities } from "@/utils/text";

const MIN = 2;
const MAX = 100;

/**
 * Header search suggestions. Public catalogue data only, so it may be cached
 * by the CDN briefly. Full results live at /shop?search=…
 */
export async function GET(request: NextRequest) {
  const term = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, MAX);
  if (term.length < MIN) return NextResponse.json({ results: [] satisfies SearchSuggestion[] });

  const products = await searchProducts(term);
  const results: SearchSuggestion[] = products.map((p) => {
    const range = p.prices.price_range;
    const amount = range && range.min_amount !== range.max_amount ? range.min_amount : p.prices.price;
    const price = formatPrice({
      amount,
      minorUnit: p.prices.currency_minor_unit,
      currencyCode: p.prices.currency_code,
    });
    return {
      id: p.id,
      name: decodeEntities(p.name),
      slug: p.slug,
      price: range && range.min_amount !== range.max_amount ? `From ${price}` : price,
      image: p.images[0]?.thumbnail ?? p.images[0]?.src ?? null,
      inStock: p.is_in_stock,
    };
  });

  return NextResponse.json(
    { results },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    },
  );
}
