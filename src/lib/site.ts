/**
 * Public, non-secret site configuration.
 *
 * Business details are taken verbatim from https://zoomx.lk (audited
 * 2026-11-10). Values marked `null` are unknown and must be supplied by the
 * client — components must hide them rather than invent a substitute.
 */

// Must be a literal `process.env.NEXT_PUBLIC_*` reference so Next.js inlines it.
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export const siteUrl = (rawSiteUrl && rawSiteUrl.trim()) || "http://localhost:3000";

export const site = {
  name: "ZOOM X",
  shortName: "ZoomX",
  tagline: "Pure Power, Gentle Touch.",
  description:
    "Eco-conscious household cleaning and home-care products made in Sri Lanka.",
  locale: "en-LK",
  country: "LK",
  currency: "LKR",
  legalEntity: "Capital Wills Holdings (Pvt) Ltd",
  contact: {
    phone: "+94 777 878 667",
    phoneHref: "tel:+94777878667",
    email: null as string | null, // obfuscated on current site — awaiting confirmation
    office: "No 419, Galle Road, Ratmalana, Sri Lanka",
    factory: "No 49, 10th Cross Lane, Borupona, Sri Lanka",
  },
  // Icons exist on the current site but have no real URLs — awaiting client.
  social: {
    facebook: null as string | null,
    youtube: null as string | null,
    x: null as string | null,
  },
} as const;
