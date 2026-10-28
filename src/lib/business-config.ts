export interface ServiceOffering {
  id: string;
  name: string;
  description: string;
  basePriceCents: number;
  minPriceCents: number;
  maxDiscountPercent: number;
  depositPercent: number;
  deliveryWeeks: string;
}

export const BUSINESS = {
  name: "BrightPath Digital Agency",
  tagline: "Growth marketing and web for US & LatAm SMBs",
  currency: "USD" as const,
  quoteValidDays: 14,
  supportEmail: "hello@brightpath-demo.example",
  verifiedFacts: [
    "We are a registered US LLC with bilingual (EN/ES) account teams.",
    "Standard deposit is 40% to start work; balance due at milestone delivery.",
    "We never offer discounts above the configured maximum without manager approval.",
    "All prices are in USD; LatAm clients may pay via PayPal in local currency at PayPal's FX rate.",
    "Kickoff within 5 business days after deposit clears.",
  ],
};

export const SERVICES: ServiceOffering[] = [
  {
    id: "landing-sprint",
    name: "Landing Page Sprint",
    description:
      "Single high-converting landing page, copy polish, mobile-first, 2 revision rounds.",
    basePriceCents: 250000,
    minPriceCents: 220000,
    maxDiscountPercent: 8,
    depositPercent: 40,
    deliveryWeeks: "2-3",
  },
  {
    id: "ads-setup",
    name: "Paid Ads Setup (Meta + Google)",
    description:
      "Account structure, 3 campaigns, pixel/conversion setup, 30-day optimization playbook.",
    basePriceCents: 180000,
    minPriceCents: 160000,
    maxDiscountPercent: 10,
    depositPercent: 40,
    deliveryWeeks: "2",
  },
  {
    id: "full-funnel",
    name: "Full Funnel Package",
    description:
      "Landing + ads setup + email nurture sequence + monthly reporting for 90 days.",
    basePriceCents: 650000,
    minPriceCents: 580000,
    maxDiscountPercent: 12,
    depositPercent: 40,
    deliveryWeeks: "8-10",
  },
];

export const OBJECTION_PLAYBOOK: Record<string, string> = {
  price:
    "I can walk through what's included line by line. Our floor price protects delivery quality—we can adjust scope, not invent discounts beyond policy.",
  trust:
    "You'll receive a written scope, milestone timeline, and PayPal receipt instantly. Deposits are protected by PayPal Buyer Protection where eligible.",
  timing:
    "We hold kickoff slots for 48 hours after quote. If you need a later start, we can lock pricing with a deposit and schedule kickoff when you're ready.",
};

export function findService(query: string): ServiceOffering | undefined {
  const q = query.toLowerCase();
  return SERVICES.find(
    (s) =>
      s.id.includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
}

export function getServiceById(id: string): ServiceOffering | undefined {
  return SERVICES.find((s) => s.id === id);
}
