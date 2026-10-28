import { NextResponse } from "next/server";
import { advanceOnboarding, markLeadPaidFromWebhook } from "@/lib/db";
import {
  isPaymentCompletedEvent,
  verifyPayPalWebhook,
} from "@/lib/paypal/webhook";

export async function POST(req: Request) {
  const raw = await req.text();
  let body: unknown;
  try {
    body = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const headers: Record<string, string | undefined> = {};
  req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const verification = await verifyPayPalWebhook(headers, body);

  if (!verification.verified) {
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 401 });
  }

  if (!isPaymentCompletedEvent(verification.eventType)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const orderId = verification.resourceId;
  if (!orderId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const lead = markLeadPaidFromWebhook(orderId);
  if (lead) {
    advanceOnboarding(lead.id);
  }

  return NextResponse.json({ ok: true, lead });
}
