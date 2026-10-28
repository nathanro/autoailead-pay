import type { AppMode } from "@/lib/types";

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim().length > 0 ? v.trim() : undefined;
}

export function isDemoMode(): boolean {
  if (env("DEMO_MODE") === "true") return true;
  const clientId = env("PAYPAL_CLIENT_ID");
  const secret = env("PAYPAL_CLIENT_SECRET");
  if (!clientId || !secret) return true;
  if (clientId.startsWith("your_") || secret.startsWith("your_")) return true;
  return false;
}

export function isLlmConfigured(): boolean {
  const key = env("LLM_API_KEY");
  if (!key || key.startsWith("your_")) return false;
  return true;
}

export function getAppMode(): AppMode {
  const demoMode = isDemoMode();
  const clientId = env("PAYPAL_CLIENT_ID");
  return {
    demoMode,
    paypalConfigured: !demoMode,
    llmConfigured: isLlmConfigured(),
    paypalEnv: env("PAYPAL_ENV") === "live" ? "live" : "sandbox",
    paypalClientId: demoMode ? null : (clientId ?? null),
  };
}

export function getAppUrl(): string {
  return env("APP_URL") ?? "http://localhost:43123";
}

export function getPayPalApiBase(): string {
  return getAppMode().paypalEnv === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export function getPayPalCredentials(): {
  clientId: string;
  clientSecret: string;
} | null {
  if (isDemoMode()) return null;
  const clientId = env("PAYPAL_CLIENT_ID");
  const clientSecret = env("PAYPAL_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export function getWebhookId(): string | undefined {
  return env("PAYPAL_WEBHOOK_ID");
}

export function getLlmConfig(): {
  apiKey: string;
  baseUrl: string;
  model: string;
} | null {
  const apiKey = env("LLM_API_KEY");
  if (!apiKey || apiKey.startsWith("your_")) return null;
  return {
    apiKey,
    baseUrl: env("LLM_BASE_URL") ?? "https://api.openai.com/v1",
    model: env("LLM_MODEL") ?? "gpt-4o-mini",
  };
}
