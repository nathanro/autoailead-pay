import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildQuote, QuoteGuardrailError } from "@/lib/quote-engine";
import {
  createLead,
  markLeadPaidFromWebhook,
  resetDbConnection,
  updateLead,
} from "@/lib/db";
import {
  isPaymentCompletedEvent,
  stableEventDigest,
  verifyPayPalWebhook,
} from "@/lib/paypal/webhook";
import { applyCaptureToLeadAmount, capturePayPalOrder } from "@/lib/paypal/orders";

describe("quote guardrails", () => {
  it("rejects discounts above policy", () => {
    expect(() =>
      buildQuote({ serviceId: "landing-sprint", requestedDiscountPercent: 50 }),
    ).toThrow(QuoteGuardrailError);
  });

  it("builds deposit from approved pricing", () => {
    const quote = buildQuote({
      serviceId: "landing-sprint",
      requestedDiscountPercent: 5,
    });
    expect(quote.depositCents).toBe(Math.round(quote.subtotalCents * 0.4));
    expect(quote.currency).toBe("USD");
  });
});

describe("paypal webhook helpers", () => {
  it("recognizes capture completed events", () => {
    expect(isPaymentCompletedEvent("PAYMENT.CAPTURE.COMPLETED")).toBe(true);
    expect(isPaymentCompletedEvent("CHECKOUT.ORDER.APPROVED")).toBe(false);
  });

  it("verifies webhooks in demo mode without credentials", async () => {
    process.env.DEMO_MODE = "true";
    const result = await verifyPayPalWebhook(
      {},
      {
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: { id: "ORDER-123" },
      },
    );
    expect(result.verified).toBe(true);
    expect(result.resourceId).toBe("ORDER-123");
    delete process.env.DEMO_MODE;
  });

  it("has stable digest for idempotency checks", () => {
    const a = stableEventDigest({ id: 1, type: "x" });
    const b = stableEventDigest({ id: 1, type: "x" });
    expect(a).toBe(b);
  });
});

describe("lead payment lifecycle", () => {
  let dbFile = "";

  beforeEach(() => {
    dbFile = path.join(os.tmpdir(), `leads-test-${Date.now()}.db`);
    process.env.LEADS_DB_PATH = dbFile;
    resetDbConnection();
  });

  afterEach(() => {
    resetDbConnection();
    if (fs.existsSync(dbFile)) fs.unlinkSync(dbFile);
    delete process.env.LEADS_DB_PATH;
  });

  it("marks lead paid when webhook references paypal order", () => {
    const lead = createLead();
    const quote = buildQuote({ serviceId: "ads-setup" });
    updateLead(lead.id, {
      quote,
      paypalOrderId: "MOCK-ORDER-ABC",
      status: "checkout",
    });

    const paid = markLeadPaidFromWebhook("MOCK-ORDER-ABC", quote.depositCents);
    expect(paid?.status).toBe("paid");
    expect(paid?.onboardingStep).toBe(1);
  });

  it("captures mock paypal orders in demo mode", async () => {
    process.env.DEMO_MODE = "true";
    const capture = await capturePayPalOrder("MOCK-ORDER-DEMO");
    expect(capture.status).toBe("COMPLETED");
    expect(applyCaptureToLeadAmount(capture, 72000)).toBe(72000);
    delete process.env.DEMO_MODE;
  });
});
