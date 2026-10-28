import {
  BUSINESS,
  getServiceById,
  type ServiceOffering,
} from "@/lib/business-config";
import type { Quote } from "@/lib/types";

export interface QuoteRequest {
  serviceId: string;
  requestedDiscountPercent?: number;
  scopeNotes?: string;
}

export class QuoteGuardrailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuoteGuardrailError";
  }
}

export function buildQuote(req: QuoteRequest): Quote {
  const service = getServiceById(req.serviceId);
  if (!service) {
    throw new QuoteGuardrailError("Unknown service. Choose from our catalog only.");
  }

  const discount = Math.max(0, req.requestedDiscountPercent ?? 0);
  if (discount > service.maxDiscountPercent) {
    throw new QuoteGuardrailError(
      `Maximum approved discount for ${service.name} is ${service.maxDiscountPercent}%. I cannot offer ${discount}% without manager approval.`,
    );
  }

  const subtotalCents = Math.max(
    service.minPriceCents,
    Math.round(service.basePriceCents * (1 - discount / 100)),
  );

  const depositCents = Math.round(
    subtotalCents * (service.depositPercent / 100),
  );

  const lineItems = [
    {
      label: service.name,
      amountCents: subtotalCents,
    },
  ];

  if (req.scopeNotes) {
    lineItems.push({
      label: "Scope notes (included in delivery)",
      amountCents: 0,
    });
  }

  return {
    serviceId: service.id,
    serviceName: service.name,
    lineItems,
    subtotalCents,
    depositPercent: service.depositPercent,
    depositCents,
    currency: BUSINESS.currency,
    validDays: BUSINESS.quoteValidDays,
    notes:
      req.scopeNotes?.trim() ||
      `Deposit ${service.depositPercent}% due today via PayPal; balance invoiced at milestones.`,
  };
}

export function suggestServiceFromText(text: string): ServiceOffering | null {
  const t = text.toLowerCase();
  if (t.includes("funnel") || t.includes("full") || t.includes("package")) {
    return getServiceById("full-funnel") ?? null;
  }
  if (
    t.includes("ads") ||
    t.includes("google") ||
    t.includes("meta") ||
    t.includes("facebook")
  ) {
    return getServiceById("ads-setup") ?? null;
  }
  if (t.includes("landing") || t.includes("page") || t.includes("website")) {
    return getServiceById("landing-sprint") ?? null;
  }
  return null;
}

export function formatQuoteForChat(quote: Quote): string {
  const dollars = (quote.depositCents / 100).toFixed(2);
  const total = (quote.subtotalCents / 100).toFixed(2);
  return [
    `**${quote.serviceName}**`,
    `Project total: $${total} ${quote.currency}`,
    `Deposit due today (${quote.depositPercent}%): **$${dollars}**`,
    quote.notes,
    `Quote valid ${quote.validDays} days. Ready to pay securely with PayPal?`,
  ].join("\n");
}
