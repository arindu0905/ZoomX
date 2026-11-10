"use client";

import { useEffect } from "react";
import { useCartStore } from "@/store/cart";
import { BagDrawer } from "./bag-drawer";

/** Loads the customer's WooCommerce cart once per page load and mounts the bag drawer. */
export function CartProvider() {
  const load = useCartStore((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  return <BagDrawer />;
}
