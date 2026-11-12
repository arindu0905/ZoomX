import { NotFoundContent } from "@/components/layout/not-found-content";
import { ShopChrome } from "@/components/layout/shop-chrome";

/** Unknown top-level URLs: the storefront 404 inside the shop frame. */
export default function NotFound() {
  return (
    <ShopChrome>
      <NotFoundContent />
    </ShopChrome>
  );
}
