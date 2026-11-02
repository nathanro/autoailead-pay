# AutoAI Lead Pay

**AutoAI Lead Pay** is an AI-powered sales closer for agencies and small businesses (US + LatAm). It chats with inbound leads, qualifies them, handles price/trust/timing objections using verified business data and margin guardrails, generates a tailored quote, and collects the deposit through **PayPal**—with webhooks that mark the lead as paid and start onboarding.

Built for the [PayPal AI Hackathon on Devpost](https://paypalaihackathon.devpost.com/) (sandbox only). License: **MIT**.

## Features (MVP)

- AI closer chat (rule-based demo agent, optional OpenAI-compatible LLM when configured)
- Guardrailed quote engine (max discount per service, minimum prices, deposit %)
- PayPal Checkout **Orders v2** (Smart Buttons when sandbox credentials are set)
- PayPal webhook endpoint with signature verification (mock-friendly demo mode)
- Leads / payments dashboard (**AG Grid** community)
- Light / dark theme toggle, responsive layout (375px+)
- **Demo mode** runs without any secrets (mock PayPal + simulated webhook)

## Quick start (demo mode)

Requirements: **Node.js 20+**

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123). You should see a **Demo mode** badge. Walk through chat → quote → **Pay with PayPal (demo sandbox UI)** → check **Dashboard** for `paid` status.

No `.env` file is required for demo mode.

## Configuration

Copy the example env file (placeholders only—never commit real secrets):

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|----------|---------|
| `PAYPAL_SANDBOX_CLIENT_ID` | Sandbox REST app Client ID (primary) |
| `PAYPAL_SANDBOX_CLIENT_SECRET` | Sandbox REST app Secret |
| `PAYPAL_WEBHOOK_ID` | Webhook ID from PayPal Developer Dashboard (optional locally; required for verified webhooks in sandbox) |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Legacy fallback names |
| `LLM_API_KEY` | OpenAI-compatible API key (optional) |
| `LLM_BASE_URL` | API base (default OpenAI) |
| `LLM_MODEL` | Model name (default `gpt-4o-mini`) |
| `APP_URL` | Public URL for return links and webhook registration |
| `DEMO_MODE` | Set `true` to force mock PayPal even if credentials exist |

When `PAYPAL_SANDBOX_CLIENT_ID` and `PAYPAL_SANDBOX_CLIENT_SECRET` are missing or still placeholders, the app stays in **demo mode** automatically. API base for sandbox is always `https://api-m.sandbox.paypal.com` unless you opt into live via `PAYPAL_ENV=live` (hackathon: stay on sandbox).

### PayPal sandbox smoke test (CLI)

With real sandbox credentials in `.env.local` (never commit):

```bash
npm run smoke:sandbox
```

Prints only JSON `{ "orderId", "status" }` after OAuth + Orders v2 create. Does not log secrets or access tokens.

### PayPal sandbox webhook (production-like testing)

1. In [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/), create a sandbox REST app and copy **Client ID** and **Secret**.
2. Add them to `.env.local`.
3. Expose your local server (or use your Render URL) and create a webhook pointing to:

   `https://<your-host>/api/webhooks/paypal`

4. Subscribe to **`PAYMENT.CAPTURE.COMPLETED`** (and related checkout events as needed).
5. Copy the **Webhook ID** into `PAYPAL_WEBHOOK_ID`.

Demo mode skips signature verification and accepts simulated events via `POST /api/demo/simulate-webhook`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server on port **43123** |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Vitest unit tests (quotes, webhooks, payment lifecycle) |
| `npm run smoke:sandbox` | OAuth + create sandbox order (requires `PAYPAL_SANDBOX_*` in env) |

## Deploy on Render

This repo includes [`render.yaml`](render.yaml). Connect the GitHub repo on Render, set the secret env vars in the dashboard, and deploy. Set `APP_URL` to your Render service URL before registering PayPal webhooks.

## Judge / reviewer test credentials (PayPal sandbox)

Add your sandbox **buyer** test account here before submission (PayPal provides these in the Developer Dashboard → Sandbox → Accounts):

| Role | Email | Password |
|------|-------|----------|
| Sandbox buyer | `buyer@example.com` | `(set before Devpost submission)` |
| Sandbox seller | `(your business sandbox email)` | `(not shared publicly)` |

Judges can use **demo mode** without credentials, or log into PayPal sandbox as the buyer when testing live Smart Buttons.

> Replace placeholder buyer credentials with real sandbox buyer email/password from your PayPal Developer sandbox before the Devpost deadline.

## Architecture

```text
Lead chat → Agent (LLM or rules) → Quote engine (guardrails)
    → POST /api/paypal/orders (create order + approve link)
    → PayPal JS SDK, redirect approve link, or demo capture
    → /checkout/return (capture after redirect)
    → POST /api/webhooks/paypal (verified) → SQLite lead status = paid → onboarding step
```

Local data is stored in `./data/leads.db` (gitignored).

## Sponsor integrations

- **PayPal** — Orders v2 checkout, webhook verification, sandbox-only
- **AG Grid** — Leads dashboard table
- **Render** — `render.yaml` for one-click deploy

## Demo video outline

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) for a ≤3 minute recording beat sheet.

## Security

- No secrets in the repository—only `.env.example`
- Run a secret scan before release: `gitleaks detect --source . --verbose`

## License

MIT — see [LICENSE](LICENSE).
