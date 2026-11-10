/**
 * Homepage copy. Every line is taken (lightly edited for length) from the
 * current zoomx.lk pages noted beside it. Claims that need certification
 * evidence (germ-kill %, "dermatologically tested and certified",
 * "phosphate and paraben free", "food-contact certified") are deliberately
 * excluded until the client supplies proof — see docs/PHASE-1-AUDIT.md §3.
 *
 * CLIENT APPROVAL REQUIRED before launch.
 */

export const hero = {
  eyebrow: "ZOOM X by Wills",
  title: "Pure Power, Gentle Touch.", // zoomx.lk footer tagline
  lead: "We blend powerful cleaning with gentle ingredients for everyday peace of mind.", // /products
  primary: { label: "Shop the range", href: "/shop" },
  secondary: { label: "Our story", href: "/about" },
};

/**
 * Optional hero product image. Null until a real studio packshot is
 * approved: the AI renders on zoomx.lk show garbled label text and do not
 * represent the actual packaging.
 */
export const heroImage: { src: string; alt: string; width: number; height: number } | null = null;

/** Product names listed on zoomx.lk/products. Shown until WooCommerce categories exist. */
export const range = {
  eyebrow: "The range",
  title: "Everything your home needs to feel fresh.",
  lead: "From greasy dishes to stained laundry and stiff fabrics, ZOOM X has you covered.", // home
  products: [
    "Dish Washing Liquid",
    "Laundry Detergent",
    "Fabric Conditioner",
    "All Purpose & All Surface",
    "General Purpose Cleaner",
    "Glass Cleaner",
    "Tile Cleaner",
    "Toilet Bowl Cleaner",
    "Hand Wash",
    "Air Freshener",
  ],
};

/** zoomx.lk/for-businesses */
export const business = {
  eyebrow: "For businesses",
  title: "Big mess? Simple clean.",
  lead: "From hotels to offices, restaurants to retailers — ZOOM X delivers professional-grade cleaning, sustainably and affordably.",
  points: [
    "Multiple container sizes, including 5L, 10L and 20L",
    "Custom pricing for bulk orders",
    "A dedicated account manager for large clients",
  ],
  cta: { label: "Talk to our team", href: "/contact" },
};

/** zoomx.lk/about-us */
export const story = {
  eyebrow: "Our story",
  title: "Where clean meets care.",
  paragraphs: [
    "ZOOM X began with a simple but powerful vision — to make everyday cleaning safer, smarter, and more sustainable.",
    "As a Sri Lankan brand committed to healthy living, we set out to create cleaning products that deliver exceptional results while protecting the wellbeing of families, communities, and the planet.",
  ],
  values: [
    { title: "Quality", body: "Every product is tested and crafted with high-performance ingredients for reliable results." },
    { title: "Innovation", body: "We keep developing better formulas for the evolving needs of modern homes and businesses." },
    { title: "Integrity", body: "Transparent in our practices, honest in our claims." },
    { title: "Sustainability", body: "Eco-conscious practices that reduce our impact without compromising performance." },
  ],
  cta: { label: "Read more about ZOOM X", href: "/about" },
};

/** zoomx.lk home — "Why We Care" */
export const why = {
  eyebrow: "Why ZOOM X",
  title: "Clean that cares.",
  items: [
    { title: "Superior cleaning", body: "Designed to tackle even the toughest stains and dirt." },
    { title: "Fair pricing", body: "Premium-quality products at competitive prices." },
    { title: "Customer first", body: "Your satisfaction is our priority — we’re always here to help." },
    { title: "Trusted brand", body: "A reputation built on reliability and excellence." },
  ],
};
