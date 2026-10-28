import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/config";
import { getLead, markLeadPaidFromWebhook, updateLead } from "@/lib/db";

/** Demo-only helper to simulate PayPal webhook after mock checkout */
export async function POST(req: Request) {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Demo simulator disabled" }, { status: 403 });
  }

  const body = (await req.json()) as { orderId?: string; leadId?: string };
  const { orderId, leadId } = body;
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  if (leadId) {
    updateLead(leadId, { paypalOrderId: orderId });
  }

  const lead = markLeadPaidFromWebhook(orderId);
  return NextResponse.json({ ok: true, lead });
}

export async function GET() {
  return NextResponse.json({
    hint: "POST { orderId, leadId } in demo mode to simulate PAYMENT.CAPTURE.COMPLETED",
    demo: isDemoMode(),
  });
}
