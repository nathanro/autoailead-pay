/**
 * PayPal sandbox smoke test — prints order id + status only (never secrets).
 * Requires PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET in env or .env.local
 */
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) {
  loadEnv({ path: envLocal });
}

async function main(): Promise<void> {
  const { getPayPalAccessToken } = await import("../src/lib/paypal/client");
  const { createSmokeTestOrder } = await import("../src/lib/paypal/orders");
  const { getPayPalApiBase, isDemoMode } = await import("../src/lib/config");

  if (isDemoMode()) {
    console.error(
      "Smoke test aborted: demo mode (missing or placeholder PAYPAL_SANDBOX_CLIENT_ID / PAYPAL_SANDBOX_CLIENT_SECRET).",
    );
    process.exit(1);
  }

  await getPayPalAccessToken();
  console.log(`PayPal API: ${getPayPalApiBase()} (OAuth OK)`);

  const order = await createSmokeTestOrder();
  console.log(JSON.stringify({ orderId: order.id, status: order.status }));
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`Smoke test failed: ${message}`);
  process.exit(1);
});
