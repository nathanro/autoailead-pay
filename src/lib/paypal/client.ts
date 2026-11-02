import { getPayPalApiBase, getPayPalCredentials } from "@/lib/config";

export async function getPayPalAccessToken(): Promise<string> {
  const creds = getPayPalCredentials();
  if (!creds) {
    throw new Error(
      "PayPal sandbox credentials not configured (set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET)",
    );
  }
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
    throw new Error(`PayPal OAuth failed: HTTP ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
