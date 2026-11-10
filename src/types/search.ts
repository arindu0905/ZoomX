export interface SearchSuggestion {
  id: number;
  name: string;
  slug: string;
  /** Pre-formatted from WooCommerce prices. */
  price: string;
  image: string | null;
  inStock: boolean;
}
