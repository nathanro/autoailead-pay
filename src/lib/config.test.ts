import { describe, expect, it, afterEach, beforeEach } from "vitest";
import { getPayPalSandboxClientId, isDemoMode } from "@/lib/config";

describe("PayPal sandbox env", () => {
  const keys = [
    "DEMO_MODE",
    "PAYPAL_SANDBOX_CLIENT_ID",
    "PAYPAL_SANDBOX_CLIENT_SECRET",
    "PAYPAL_CLIENT_ID",
    "PAYPAL_CLIENT_SECRET",
  ] as const;

  beforeEach(() => {
    for (const k of keys) delete process.env[k];
  });

  afterEach(() => {
    for (const k of keys) delete process.env[k];
  });

  it("uses demo mode when sandbox vars are missing", () => {
    expect(isDemoMode()).toBe(true);
  });

  it("exits demo mode when PAYPAL_SANDBOX_* are set", () => {
    process.env.PAYPAL_SANDBOX_CLIENT_ID = "sb-test-client";
    process.env.PAYPAL_SANDBOX_CLIENT_SECRET = "sb-test-secret";
    expect(isDemoMode()).toBe(false);
    expect(getPayPalSandboxClientId()).toBe("sb-test-client");
  });

  it("treats placeholder values as demo mode", () => {
    process.env.PAYPAL_SANDBOX_CLIENT_ID = "your_sandbox_client_id";
    process.env.PAYPAL_SANDBOX_CLIENT_SECRET = "real-secret-value";
    expect(isDemoMode()).toBe(true);
  });
});
