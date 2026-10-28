import { NextResponse } from "next/server";
import { getLead, updateLead } from "@/lib/db";
import {
  applyCaptureToLeadAmount,
  capturePayPalOrder,
  createPayPalOrder,
} from "@/lib/paypal/orders";

export async function POST(req: Request) {
  const body = (await req.json()) as { leadId?: string };
  const leadId = body.leadId;
  if (!leadId) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  const lead = getLead(leadId);
  if (!lead?.quote) {
    return NextResponse.json(
      { error: "Lead must have an approved quote" },
      { status: 400 },
    );
  }

  const order = await createPayPalOrder({
    leadId,
    amountCents: lead.quote.depositCents,
    currency: lead.quote.currency,
    description: `${lead.quote.serviceName} deposit`,
  });

  updateLead(leadId, {
    paypalOrderId: order.id,
    amountCents: lead.quote.depositCents,
    status: "checkout",
  });

  return NextResponse.json({ order });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { orderId?: string; leadId?: string };
  const { orderId, leadId } = body;
  if (!orderId || !leadId) {
    return NextResponse.json(
      { error: "orderId and leadId required" },
      { status: 400 },
    );
  }

  const lead = getLead(leadId);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const capture = await capturePayPalOrder(orderId);
  const amount = applyCaptureToLeadAmount(
    capture,
    lead.quote?.depositCents ?? lead.amountCents ?? 0,
  );

  const updated = updateLead(leadId, {
    status: "paid",
    amountCents: amount,
    onboardingStep: 1,
  });

  return NextResponse.json({ capture, lead: updated });
}
