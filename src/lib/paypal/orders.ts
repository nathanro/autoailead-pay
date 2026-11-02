import { getAppUrl, getPayPalApiBase, isDemoMode } from "@/lib/config";
import { getPayPalAccessToken } from "@/lib/paypal/client";
import { randomUUID } from "node:crypto";

export interface CreateOrderInput {
  leadId: string;
  amountCents: number;
  currency?: string;
  description: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
  demo: boolean;
  approveUrl?: string;
}

export async function createPayPalOrder(
  input: CreateOrderInput,
): Promise<PayPalOrderResult> {
  if (isDemoMode()) {
    return {
      id: `MOCK-ORDER-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "CREATED",
      demo: true,
      approveUrl: undefined,
    };
  }

  const token = await getPayPalAccessToken();
  const value = (input.amountCents / 100).toFixed(2);
  const currency = input.currency ?? "USD";
  const base = getAppUrl();

  const res = await fetch(`${getPayPalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: input.leadId,
          description: input.description.slice(0, 127),
          amount: {
            currency_code: currency,
            value,
          },
        },
      ],
      application_context: {
        brand_name: "BrightPath Digital",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${base}/checkout/return?leadId=${encodeURIComponent(input.leadId)}`,
        cancel_url: `${base}/checkout/cancel?leadId=${encodeURIComponent(input.leadId)}`,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${res.status} ${text}`);
  }

  const order = (await res.json()) as {
    id: string;
    status: string;
    links?: { rel: string; href: string }[];
  };
  const approve = order.links?.find((l) => l.rel === "approve");
  return {
    id: order.id,
    status: order.status,
    demo: false,
    approveUrl: approve?.href,
  };
}

export async function getPayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
}> {
  if (isDemoMode() || orderId.startsWith("MOCK-ORDER-")) {
    return { id: orderId, status: "CREATED" };
  }

  const token = await getPayPalAccessToken();
  const res = await fetch(`${getPayPalApiBase()}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal get order failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { id: string; status: string };
  return { id: data.id, status: data.status };
}

export async function capturePayPalOrder(orderId: string): Promise<{
  id: string;
  status: string;
  amountCents: number;
  demo: boolean;
}> {
  if (isDemoMode() || orderId.startsWith("MOCK-ORDER-")) {
    return {
      id: orderId,
      status: "COMPLETED",
      amountCents: 0,
      demo: true,
    };
  }

  const token = await getPayPalAccessToken();
  const res = await fetch(
    `${getPayPalApiBase()}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    id: string;
    status: string;
    purchase_units?: {
      payments?: { captures?: { amount?: { value?: string } }[] };
    }[];
  };
  const value =
    data.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? "0";
  const amountCents = Math.round(parseFloat(value) * 100);
  return { id: data.id, status: data.status, amountCents, demo: false };
}

export function applyCaptureToLeadAmount(
  capture: { amountCents: number; demo: boolean },
  expectedCents: number,
): number {
  if (capture.demo || capture.amountCents === 0) return expectedCents;
  return capture.amountCents;
}

/** Minimal order for CLI smoke test (no lead record required). */
export async function createSmokeTestOrder(): Promise<PayPalOrderResult> {
  return createPayPalOrder({
    leadId: "smoke-test",
    amountCents: 100,
    currency: "USD",
    description: "AutoAI Lead Pay sandbox smoke test",
  });
}
