import crypto from "node:crypto";
import {
  getPayPalApiBase,
  getPayPalCredentials,
  getWebhookId,
  isDemoMode,
} from "@/lib/config";

export interface WebhookVerificationInput {
  transmissionId: string;
  transmissionTime: string;
  certUrl: string;
  authAlgo: string;
  transmissionSig: string;
  webhookEvent: unknown;
}

export interface WebhookParseResult {
  verified: boolean;
  eventType: string | null;
  resourceId: string | null;
  demo: boolean;
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
  if (!res.ok) throw new Error("PayPal auth failed for webhook verification");
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function verifyPayPalWebhook(
  headers: Record<string, string | undefined>,
  body: unknown,
): Promise<WebhookParseResult> {
  const event = body as {
    event_type?: string;
    resource?: { id?: string; supplementary_data?: { related_ids?: { order_id?: string } } };
  };

  if (isDemoMode()) {
    return {
      verified: true,
      eventType: event.event_type ?? null,
      resourceId: extractOrderId(event),
      demo: true,
    };
  }

  const webhookId = getWebhookId();
  if (!webhookId || webhookId.startsWith("your_")) {
    return {
      verified: false,
      eventType: null,
      resourceId: null,
      demo: false,
    };
  }

  const transmissionId = headers["paypal-transmission-id"];
  const transmissionTime = headers["paypal-transmission-time"];
  const certUrl = headers["paypal-cert-url"];
  const authAlgo = headers["paypal-auth-algo"];
  const transmissionSig = headers["paypal-transmission-sig"];

  if (
    !transmissionId ||
    !transmissionTime ||
    !certUrl ||
    !authAlgo ||
    !transmissionSig
  ) {
    return {
      verified: false,
      eventType: null,
      resourceId: null,
      demo: false,
    };
  }

  const token = await fetchAccessToken();
  const res = await fetch(
    `${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: body,
      }),
    },
  );

  if (!res.ok) {
    return {
      verified: false,
      eventType: null,
      resourceId: null,
      demo: false,
    };
  }

  const verdict = (await res.json()) as { verification_status?: string };
  const verified = verdict.verification_status === "SUCCESS";

  return {
    verified,
    eventType: event.event_type ?? null,
    resourceId: extractOrderId(event),
    demo: false,
  };
}

function extractOrderId(event: {
  event_type?: string;
  resource?: {
    id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}): string | null {
  const resource = event.resource;
  if (!resource) return null;
  if (resource.supplementary_data?.related_ids?.order_id) {
    return resource.supplementary_data.related_ids.order_id;
  }
  if (
    event.event_type?.includes("CHECKOUT.ORDER") ||
    event.event_type?.includes("PAYMENT.CAPTURE")
  ) {
    return resource.id ?? null;
  }
  return resource.id ?? null;
}

/** Local CRC check used in unit tests without calling PayPal */
export function crc32Hex(input: string): string {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    crc = table[(crc ^ input.charCodeAt(i)) & 0xff]! ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0).toString(16);
}

export function stableEventDigest(event: unknown): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(event))
    .digest("hex");
}

export function isPaymentCompletedEvent(eventType: string | null): boolean {
  if (!eventType) return false;
  return eventType === "PAYMENT.CAPTURE.COMPLETED";
}
