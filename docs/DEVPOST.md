# Devpost submission text — AutoAI Lead Pay

Use the sections below in the [PayPal AI Hackathon](https://paypalaihackathon.devpost.com/) form. English. No secret values.

---

## Project name

AutoAI Lead Pay

## Tagline

AI closer that qualifies leads, quotes with guardrails, and collects deposits through PayPal—end to end.

## Inspiration

Agencies and SMBs in the US and Latin America often lose revenue because inbound chat stops at “book a call.” Buyers want pricing, trust, and a way to pay—not another calendar link. We wanted an agent that **closes** in one thread: qualify, handle objections, show a real quote, and take a deposit with a payment brand people already trust.

## What it does

AutoAI Lead Pay is a web app with:

- An **AI closer chat** that qualifies service interest, budget, and timing.
- A **guardrailed quote engine** that never promises discounts beyond configured limits.
- **PayPal Checkout Orders v2** to create, approve, and capture deposit payments in **sandbox**.
- A **verified PayPal webhook** handler that marks leads **paid** and triggers onboarding.
- An **AG Grid dashboard** for leads, quotes, PayPal order IDs, and status.

It runs in **demo mode** without credentials so judges can try the full UX immediately.

## How we built it

- **Next.js** (App Router), TypeScript, Tailwind, and shadcn/ui for a responsive UI (light/dark).
- **SQLite** (`better-sqlite3`) for lead and message storage.
- **PayPal REST API** (`api-m.sandbox.paypal.com`): OAuth2 client credentials, Orders v2 create/capture, and webhook signature verification via PayPal’s notifications API.
- **PayPal JavaScript SDK** for Smart Buttons; redirect approve-link flow with `/checkout/return` capture.
- **Optional LLM** (OpenAI-compatible API) when `LLM_API_KEY` is set; otherwise a rule-based agent for deterministic demos.
- **Vitest** tests for quote guardrails, webhook helpers, and payment lifecycle.
- **`render.yaml`** for Render deployment.

Developed with **Cursor Cloud Agent** assistance. All hackathon code is in this repository under the **MIT** license.

## Challenges we ran into

- Keeping **PayPal central**: every happy path must touch Orders v2 and, in production-like mode, webhooks—not a mock “paid” button.
- **Webhook verification** in sandbox while still offering a **demo mode** for judges without sandbox logins.
- Balancing **LLM flexibility** with **hard server-side guardrails** so the agent cannot invent pricing.

## Accomplishments that we're proud of

- Full-cycle flow from first message to **paid** lead in one product surface.
- Explicit **margin guardrails** in code, not only in prompts.
- **`npm run smoke:sandbox`** for quick OAuth + order creation checks without printing secrets.
- Judge-friendly **demo mode** plus real sandbox path when credentials are configured.

## What we learned

- Payment state must be owned by the **server** (create/capture/webhook), with the UI as a thin client.
- Objection handling works best when tied to **verified business facts** plus policy-enforced quotes.
- Hackathon judges need both **zero-setup demo** and **real PayPal sandbox** paths.

## What's next for AutoAI Lead Pay

- PayPal **Invoicing** or **Subscriptions** for balance payments and retainers.
- Multi-tenant agency config (catalog, languages, CRM webhooks).
- Production database and auth for agency staff.
- Deeper LatAm flows (bilingual agent, currency display via PayPal).

## Built with

- PayPal (Orders v2, Webhooks, JavaScript SDK, Sandbox)
- Next.js, React, TypeScript
- Tailwind CSS, shadcn/ui
- AG Grid (community)
- SQLite / better-sqlite3
- Render (`render.yaml`)
- Cursor / AI-assisted development
- Optional: OpenAI-compatible LLM API

## Demo & repo

- **Repository:** private GitHub `nathanro/autoailead-pay` (open source MIT for hackathon submission).
- **Try locally:** `npm install && npm run dev` (demo mode).
- **Sandbox:** set `PAYPAL_SANDBOX_CLIENT_ID`, `PAYPAL_SANDBOX_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, `APP_URL` per `.env.example`.
- **Video:** see `docs/VIDEO-SCRIPT.md` (YouTube, under 3 minutes).

## Built during the hackathon period

**Oct 1 – Nov 12, 2026** (submission deadline per Devpost rules).
