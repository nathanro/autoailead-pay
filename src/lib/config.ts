import type { AppMode } from "@/lib/types";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

function isPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.startsWith("your_") ||
    lower.includes("placeholder") ||
    lower === "changeme"
  );
}

/** Primary: PAYPAL_SANDBOX_* ; legacy fallback: PAYPAL_CLIENT_* */
export function getPayPalSandboxClientId(): string | undefined {
  return env("PAYPAL_SANDBOX_CLIENT_ID") ?? env("PAYPAL_CLIENT_ID");
}

export function getPayPalSandboxClientSecret(): string | undefined {
  return env("PAYPAL_SANDBOX_CLIENT_SECRET") ?? env("PAYPAL_CLIENT_SECRET");
}

export function isDemoMode(): boolean {
  if (env("DEMO_MODE") === "true") return true;
  const clientId = getPayPalSandboxClientId();
  const secret = getPayPalSandboxClientSecret();
  if (!clientId || !secret) return true;
  if (isPlaceholder(clientId) || isPlaceholder(secret)) return true;
  return false;
}

export function isLlmConfigured(): boolean {
  const key = env("LLM_API_KEY");
  if (!key || isPlaceholder(key)) return false;
  return true;
}

export function getAppMode(): AppMode {
  const demoMode = isDemoMode();
  const clientId = getPayPalSandboxClientId();
  return {
    demoMode,
    paypalConfigured: !demoMode,
    llmConfigured: isLlmConfigured(),
    paypalEnv: "sandbox",
    paypalClientId: demoMode ? null : (clientId ?? null),
  };
}

export function getAppUrl(): string {
  return env("APP_URL") ?? "http://localhost:43123";
}

export function getPayPalApiBase(): string {
  if (env("PAYPAL_ENV") === "live") {
    return "https://api-m.paypal.com";
  }
  return "https://api-m.sandbox.paypal.com";
}

export function getPayPalCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  if (isDemoMode()) return null;
  const clientId = getPayPalSandboxClientId();
  const clientSecret = getPayPalSandboxClientSecret();
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getWebhookId(): string | undefined {
  const id = env("PAYPAL_WEBHOOK_ID");
  if (!id || isPlaceholder(id)) return undefined;
  return id;
}

export function getLlmConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} | null {
  const apiKey = env("LLM_API_KEY");
  if (!apiKey || isPlaceholder(apiKey)) return null;
  return {
    apiKey,
    baseUrl: env("LLM_BASE_URL") ?? "https://api.openai.com/v1",
    model: env("LLM_MODEL") ?? "gpt-4o-mini",
  };
}
