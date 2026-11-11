/**
 * Content pages. Brand copy is adapted from the live zoomx.lk pages noted on
 * each entry (fetched 2026-11-10). CLIENT APPROVAL REQUIRED before launch.
 *
 * Omitted pending evidence (see docs/PHASE-1-AUDIT.md §3): "biodegradable",
 * "non-toxic", "free from phosphates/parabens/dyes", "dermatologically tested
 * and certified", "recyclable and biodegradable packaging", "energy-efficient
 * manufacturing", and the "Soak" product mention (not in the product list).
 *
 * Policy pages are DRAFTS (status: "draft"): rendered with a visible notice
 * and noindex. Bracketed text marks facts only the business can supply —
 * nothing there (fees, timeframes, windows) is invented.
 */

export interface ContentSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface ContentPage {
  slug: string;
  title: string;
  description: string;
  eyebrow?: string;
  lead?: string;
  status: "approved-copy" | "draft";
  source?: string;
  sections: ContentSection[];
}

export const about: ContentPage = {
  slug: "about",
  title: "About ZOOM X",
  description: "ZOOM X is a Sri Lankan household cleaning brand by Capital Wills Holdings — where clean meets care.",
  eyebrow: "About us",
  lead: "Where clean meets care.",
  status: "approved-copy",
  source: "https://zoomx.lk/about-us/",
  sections: [
    {
      heading: "Who we are",
      paragraphs: [
        "ZOOM X exists to raise the standard of everyday cleanliness and support healthy living — for households and businesses alike — with high-performance cleaning products made with care.",
        "To us, true cleanliness goes beyond the surface. It is about wellbeing, hygiene and respect for the environment, which is why quality, safety and sustainability sit at the heart of everything we make.",
      ],
    },
    {
      heading: "Our story",
      paragraphs: [
        "ZOOM X began with a simple but powerful vision — to make everyday cleaning safer, smarter and more sustainable.",
        "As a Sri Lankan brand committed to healthy living, we set out to create cleaning products that deliver exceptional results while protecting the wellbeing of families, communities and the planet.",
      ],
    },
    {
      heading: "What we stand for",
      bullets: [
        "Quality — every product is tested and crafted with high-performance ingredients for reliable results.",
        "Innovation — we keep developing better formulas and smarter solutions for modern homes and businesses.",
        "Integrity — transparent in our practices, honest in our claims.",
        "Sustainability — eco-conscious practices that reduce our impact without compromising performance.",
      ],
    },
    {
      heading: "Who makes ZOOM X",
      paragraphs: ["ZOOM X by Wills is a brand of Capital Wills Holdings (Pvt) Ltd, Ratmalana, Sri Lanka."],
    },
  ],
};

export const sustainability: ContentPage = {
  slug: "sustainability",
  title: "Sustainability",
  description: "Why ZOOM X puts the planet into every decision — our mission for affordable, eco-conscious cleaning.",
  eyebrow: "Sustainability",
  lead: "For the love of the planet.",
  status: "approved-copy",
  source: "https://zoomx.lk/sustainability/",
  sections: [
    {
      paragraphs: [
        "Caring for your family means choosing products that are clean, kind and conscious. That belief shapes how we make ZOOM X.",
      ],
    },
    {
      heading: "Our mission",
      paragraphs: [
        "To make eco-friendly choices affordable and convenient, so doing the right thing for the planet never feels overwhelming.",
      ],
    },
    {
      heading: "Built for change",
      paragraphs: [
        "We want to protect the planet for the generations that follow, so sustainability is a priority across our business — from formulation to how products reach you.",
      ],
    },
    {
      heading: "Innovation with purpose",
      paragraphs: [
        "We invest in research and development and test every product for quality, so better cleaning and a lighter footprint can go hand in hand.",
      ],
    },
  ],
};

export const forBusinesses: ContentPage = {
  slug: "for-businesses",
  title: "For businesses",
  description:
    "Professional-grade ZOOM X cleaning for hotels, offices, restaurants, schools and retailers, with bulk sizes.",
  eyebrow: "For businesses",
  lead: "Big mess? Simple clean.",
  status: "approved-copy",
  source: "https://zoomx.lk/for-businesses/",
  sections: [
    {
      heading: "Clean solutions for every business",
      paragraphs: [
        "From hotels to offices, restaurants to retailers — ZOOM X delivers professional-grade cleaning, sustainably and affordably.",
      ],
    },
    {
      heading: "Bulk supply",
      paragraphs: ["Bulk purchasing for hotels, restaurants, schools and offices:"],
      bullets: [
        "Multiple container sizes, including 5L, 10L and 20L",
        "Custom pricing for bulk orders",
        "A dedicated account manager for large clients",
      ],
    },
    {
      heading: "Talk to our team",
      paragraphs: [
        "Call us on +94 777 878 667 to discuss sizes, pricing and delivery for your business. Bulk and subscription terms are agreed directly with our team.",
      ],
    },
  ],
};

export const faqs: ContentPage = {
  slug: "faqs",
  title: "FAQs",
  description: "Answers to common questions about ordering from ZOOM X online.",
  eyebrow: "Help",
  lead: "Frequently asked questions.",
  status: "draft",
  sections: [
    {
      heading: "How do I place an order?",
      paragraphs: [
        "Add products to your cart, then choose Check out. Enter your contact details and delivery address, choose a payment method and place your order. You’ll see a confirmation page with your order number.",
      ],
    },
    {
      heading: "Which payment methods can I use?",
      paragraphs: [
        "The methods available are shown at checkout. Cash on delivery is offered where enabled. [Card and mobile-wallet payments via PayHere — to be confirmed at launch.]",
      ],
    },
    {
      heading: "Do I need an account?",
      paragraphs: [
        "No. You can check out as a guest. An account lets you see your order history and save your address.",
      ],
    },
    {
      heading: "How can I track my order?",
      paragraphs: [
        "Use Track an order with your order number and the email you used at checkout, or see Orders in your account.",
      ],
    },
    {
      heading: "Where do you deliver, and how much does it cost?",
      paragraphs: [
        "Delivery options and charges for your address are shown in your cart and at checkout before you pay. See our Delivery Policy. [Coverage and timeframes to be confirmed by ZOOM X.]",
      ],
    },
    {
      heading: "Can I order in bulk for my business?",
      paragraphs: ["Yes — see For businesses or call +94 777 878 667."],
    },
  ],
};

const DRAFT_NOTE =
  "This is a draft prepared for the website and has not yet been approved by ZOOM X. Text in [brackets] must be confirmed by the business.";

export const policies: Record<string, ContentPage> = {
  delivery: {
    slug: "delivery",
    title: "Delivery Policy",
    description: "How ZOOM X delivers online orders in Sri Lanka.",
    status: "draft",
    sections: [
      { paragraphs: [DRAFT_NOTE] },
      {
        heading: "Where we deliver",
        paragraphs: ["We deliver to addresses in Sri Lanka. [Confirm coverage: island-wide, or listed districts.]"],
      },
      {
        heading: "Delivery charges",
        paragraphs: [
          "Delivery options and their charges are calculated for your address and shown in your cart and at checkout before you place your order. [Confirm any free-delivery threshold.]",
        ],
      },
      {
        heading: "Delivery times",
        paragraphs: ["[Confirm typical delivery times by area, and order cut-off times.]"],
      },
      {
        heading: "Cash on delivery",
        paragraphs: [
          "If you choose cash on delivery, please have the order total shown on your confirmation ready when your order arrives. [Confirm any limits on cash-on-delivery orders.]",
        ],
      },
      {
        heading: "Tracking",
        paragraphs: [
          "You can check your order status at any time with Track an order, or in your account. [Confirm courier partner and whether tracking numbers are provided.]",
        ],
      },
    ],
  },
  returns: {
    slug: "returns",
    title: "Return and Refund Policy",
    description: "Returns, damaged items and refunds for ZOOM X online orders.",
    status: "draft",
    sections: [
      { paragraphs: [DRAFT_NOTE] },
      {
        heading: "Damaged or incorrect items",
        paragraphs: [
          "If an item arrives damaged, leaking or is not what you ordered, contact us on +94 777 878 667 within [number] days of delivery with your order number and a photo.",
        ],
      },
      {
        heading: "Returns",
        paragraphs: [
          "[Confirm whether unopened products can be returned, the return window and who pays return delivery.]",
        ],
      },
      {
        heading: "Refunds",
        paragraphs: [
          "Approved refunds are made to the original payment method. Cash-on-delivery orders are refunded by [method]. [Confirm refund timeframes.]",
        ],
      },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How ZOOM X collects and uses personal information on this website.",
    status: "draft",
    sections: [
      {
        paragraphs: [
          DRAFT_NOTE + " This draft describes how the website actually handles data; it needs legal review.",
        ],
      },
      {
        heading: "Who we are",
        paragraphs: [
          "This website is operated by Capital Wills Holdings (Pvt) Ltd, No 419, Galle Road, Ratmalana, Sri Lanka. [Confirm the contact for privacy requests.]",
        ],
      },
      {
        heading: "What we collect",
        bullets: [
          "Order details: your name, email, phone number, delivery and billing addresses, order notes and the products you buy.",
          "Account details, if you create an account: your name, email and saved address. Passwords are stored only in hashed form by our store platform.",
          "Payment: card and wallet payments are processed by PayHere on its own pages. We do not receive or store your card details.",
        ],
      },
      {
        heading: "Cookies",
        bullets: [
          "zx_cart — keeps your shopping cart between pages and visits (essential).",
          "zx_session — keeps you signed in to your account (essential, only if you sign in).",
          "[List any analytics or marketing cookies if added later — none are used at present.]",
        ],
      },
      {
        heading: "How we use it",
        paragraphs: [
          "To process and deliver your orders, provide customer support, run your account and meet legal obligations. [Confirm whether marketing emails will be sent and how consent is collected.]",
        ],
      },
      {
        heading: "Who we share it with",
        paragraphs: [
          "Our website hosting and store platform providers, our payment provider (PayHere) when you pay online, and [courier partners] to deliver your order.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can view and update your account details at any time. To ask about, correct or delete your information, contact us [privacy contact]. [Confirm data retention periods.]",
        ],
      },
    ],
  },
  terms: {
    slug: "terms",
    title: "Terms and Conditions",
    description: "Terms that apply when you buy from ZOOM X online.",
    status: "draft",
    sections: [
      { paragraphs: [DRAFT_NOTE + " It needs legal review."] },
      {
        heading: "About these terms",
        paragraphs: [
          "These terms apply to orders placed on this website with Capital Wills Holdings (Pvt) Ltd (“ZOOM X”, “we”).",
        ],
      },
      {
        heading: "Prices and payment",
        paragraphs: [
          "Prices are shown in Sri Lankan rupees (LKR). The total you pay, including any delivery charges and discounts, is shown at checkout before you place your order. [Confirm whether prices include VAT.]",
        ],
      },
      {
        heading: "Orders",
        paragraphs: [
          "Your order is accepted when we confirm it. If a product becomes unavailable after you order, we will contact you and refund any amount paid for it. [Confirm.]",
        ],
      },
      {
        heading: "Delivery, returns and refunds",
        paragraphs: ["See our Delivery Policy and Return and Refund Policy."],
      },
      {
        heading: "Product use",
        paragraphs: ["Please read and follow the directions and safety information on each product’s label."],
      },
      {
        heading: "Governing law",
        paragraphs: ["These terms are governed by the laws of Sri Lanka. [Confirm with legal counsel.]"],
      },
    ],
  },
};
