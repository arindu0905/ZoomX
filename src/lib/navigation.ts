export interface NavLink {
  label: string;
  href: string;
}

export interface NavCategory {
  name: string;
  slug: string;
}

/** Primary navigation. "Categories" is rendered separately as a flyout. */
export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const footerNav: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/shop" },
      { label: "Shopping bag", href: "/cart" },
      { label: "Track an order", href: "/orders/track" },
    ],
  },
  {
    heading: "ZOOM X",
    links: [
      { label: "About", href: "/about" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "For businesses", href: "/for-businesses" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "FAQs", href: "/faqs" },
      { label: "Delivery", href: "/policies/delivery" },
      { label: "Returns & refunds", href: "/policies/returns" },
      { label: "My account", href: "/account" },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms & Conditions", href: "/policies/terms" },
];

export const categoryHref = (slug: string) => `/category/${encodeURIComponent(slug)}`;
