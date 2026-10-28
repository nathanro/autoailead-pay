import { BUSINESS, OBJECTION_PLAYBOOK, SERVICES } from "@/lib/business-config";
import { getLlmConfig, isLlmConfigured } from "@/lib/config";
import type { AgentReply, Lead } from "@/lib/types";
import {
  QuoteGuardrailError,
  buildQuote,
  formatQuoteForChat,
  suggestServiceFromText as suggestFromQuoteEngine,
} from "@/lib/quote-engine";

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

function extractEmail(text: string): string | null {
  const m = text.match(EMAIL_RE);
  return m ? m[0] : null;
}

function detectObjection(text: string): keyof typeof OBJECTION_PLAYBOOK | null {
  const t = text.toLowerCase();
  if (t.includes("expensive") || t.includes("price") || t.includes("cost")) {
    return "price";
  }
  if (
    t.includes("trust") ||
    t.includes("scam") ||
    t.includes("legit") ||
    t.includes("refund")
  ) {
    return "trust";
  }
  if (
    t.includes("timing") ||
    t.includes("later") ||
    t.includes("month") ||
    t.includes("busy")
  ) {
    return "timing";
  }
  return null;
}

function parseDiscountRequest(text: string): number {
  const m = text.match(/(\d+)\s*%/);
  if (m) return Number(m[1]);
  if (text.toLowerCase().includes("discount")) return 15;
  return 0;
}

function ruleBasedReply(lead: Lead, userText: string): AgentReply {
  const patch: AgentReply["leadPatch"] = {};
  let message = "";
  let quote = lead.quote;
  let readyForCheckout = false;

  const email = extractEmail(userText);
  if (email) patch.email = email;

  if (!lead.name && userText.split(" ").length <= 4 && !email) {
    patch.name = userText.trim();
    message = `Great to meet you, ${patch.name}. Which offering fits best—${SERVICES.map((s) => s.name).join(", ")}?`;
    return { message, leadPatch: patch };
  }

  const objection = detectObjection(userText);
  if (objection) {
    message = OBJECTION_PLAYBOOK[objection];
    if (lead.serviceInterest || lead.quote) {
      message += `\n\n${BUSINESS.verifiedFacts[2]}`;
    }
    return { message, leadPatch: patch, quote, readyForCheckout: !!quote };
  }

  const service =
    suggestFromQuoteEngine(userText) ??
    (lead.serviceInterest
      ? SERVICES.find((s) => s.id === lead.serviceInterest)
      : undefined);

  if (service && !lead.quote) {
    patch.serviceInterest = service.id;
    const discount = parseDiscountRequest(userText);
    try {
      quote = buildQuote({
        serviceId: service.id,
        requestedDiscountPercent: discount,
        scopeNotes: userText.length > 80 ? userText.slice(0, 200) : undefined,
      });
      patch.status = "quoted";
      message = formatQuoteForChat(quote);
      readyForCheckout = true;
    } catch (err) {
      if (err instanceof QuoteGuardrailError) {
        message = `${err.message}\n\n${OBJECTION_PLAYBOOK.price} Approved max discount for ${service.name} is ${service.maxDiscountPercent}%.`;
        quote = buildQuote({
          serviceId: service.id,
          requestedDiscountPercent: service.maxDiscountPercent,
        });
        patch.status = "quoted";
        message += `\n\n${formatQuoteForChat(quote)}`;
        readyForCheckout = true;
      } else {
        throw err;
      }
    }
    return { message, leadPatch: patch, quote, readyForCheckout };
  }

  if (
    userText.toLowerCase().includes("pay") ||
    userText.toLowerCase().includes("checkout") ||
    userText.toLowerCase().includes("deposit")
  ) {
    if (quote) {
      message =
        "Perfect—use the PayPal button below to pay your deposit securely. I'll mark your project as paid as soon as PayPal confirms.";
      readyForCheckout = true;
      patch.status = "checkout";
    } else {
      message =
        "I need to line up the right package first. Tell me which service you want (landing page, ads setup, or full funnel).";
    }
    return { message, leadPatch: patch, quote, readyForCheckout };
  }

  if (!lead.timeline && userText.length > 5) {
    patch.timeline = userText.slice(0, 120);
    message =
      "Noted on timing. Any budget range I should stay within? Otherwise I can quote standard pricing with our 40% deposit.";
    return { message, leadPatch: patch };
  }

  if (!lead.budgetRange && userText.match(/\$|\d/)) {
    patch.budgetRange = userText.slice(0, 80);
    message = `Thanks. Our catalog starts at $${(SERVICES[0].basePriceCents / 100).toFixed(0)} for ${SERVICES[0].name}. Which package should I quote?`;
    return { message, leadPatch: patch };
  }

  message = `I can help with ${SERVICES.map((s) => s.name).join(", ")}. Share your goal, and I'll produce a quote within policy—no invented discounts.`;
  return { message, leadPatch: patch, quote, readyForCheckout: !!quote };
}

async function llmReply(lead: Lead, userText: string): Promise<AgentReply> {
  const cfg = getLlmConfig();
  if (!cfg) return ruleBasedReply(lead, userText);

  const system = `You are ${BUSINESS.name}'s AI closer. Qualify inbound leads, handle objections using only these facts: ${BUSINESS.verifiedFacts.join(" ")} Services: ${SERVICES.map((s) => `${s.name} ($${s.basePriceCents / 100}, max discount ${s.maxDiscountPercent}%)`).join("; ")}. Never promise discounts beyond max. When ready, tell the user to pay via PayPal deposit. Keep replies under 120 words.`;

  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `Lead snapshot: ${JSON.stringify({ name: lead.name, service: lead.serviceInterest, status: lead.status })}. User said: ${userText}`,
        },
      ],
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    return ruleBasedReply(lead, userText);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content =
    data.choices?.[0]?.message?.content ??
    "Let me pull standard pricing for you.";

  const grounded = ruleBasedReply(lead, userText);
  return {
    ...grounded,
    message: `${content}\n\n${grounded.quote ? formatQuoteForChat(grounded.quote) : ""}`.trim(),
  };
}

export async function runAgentTurn(
  lead: Lead,
  userText: string,
): Promise<AgentReply> {
  if (isLlmConfigured()) {
    return llmReply(lead, userText);
  }
  return ruleBasedReply(lead, userText);
}
