import {
  getPayPalApiBase,
  getPayPalCredentials,
  isDemoMode,
} from "@/lib/config";
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

async function fetchAccessToken(): Promise<string> {
  const creds = getPayPalCredentials();
  if (!creds) throw new Error("PayPal credentials not configured");
  const auth = Buffer.from(
    `${creds.clientId}:${creds.clientSecret}`,
  ).toString("base64");
  const res = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal token error: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(
  input: CreateOrderInput,
): Promise<PayPalOrderResult> {
  if (isDemoMode()) {
    return {
      id: `MOCK-ORDER-${randomUUID().slice(0, 8).toUpperCase()}`,
      status: "CREATED",
      demo: true,
    };
  }

  const token = await fetchAccessToken();
  const value = (input.amountCents / 100).toFixed(2);
  const currency = input.currency ?? "USD";

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
        user_action: "PAY_NOW",
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

  const token = await fetchAccessToken();
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
