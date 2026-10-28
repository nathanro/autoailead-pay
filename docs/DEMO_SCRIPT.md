# Demo script outline — AutoAI Lead Pay (PayPal AI Hackathon)

**Duration target:** 2:00–2:45 (under 3-minute Devpost limit)

## Setup (before recording)

1. Run `npm run dev` with no `.env.local` (demo mode banner visible).
2. Open home at `http://localhost:43123` in light mode; toggle dark briefly to show theme support.
3. Optional second tab: `/dashboard` to show AG Grid (can split-screen or cut to it after payment).

## Beat sheet

| Time | Scene | Action | Narration (English) |
|------|--------|--------|---------------------|
| 0:00 | Title card | Logo + “AutoAI Lead Pay — AI closer with PayPal” | “We built an AI agent that qualifies leads, quotes within guardrails, and collects deposits with PayPal—not just booking meetings.” |
| 0:15 | Problem | Static bullets: agencies, LatAm SMBs, lost leads | “Agencies lose deals when chat stops at ‘let’s schedule a call.’ They need trust, pricing, and payment in one thread.” |
| 0:30 | Chat qualify | Click quick prompt: landing page for LatAm SaaS | “The agent asks what they need and maps it to real catalog pricing.” |
| 0:50 | Objection | Prompt: “Your price feels high—any discount?” | “It handles objections using verified policy—no invented 50% off.” |
| 1:05 | Quote | Agent returns deposit amount | “It generates a quote with a 40% deposit aligned to margin rules.” |
| 1:20 | PayPal | Click demo PayPal button | “Checkout uses PayPal Orders—sandbox in production config, mock UI locally.” |
| 1:40 | Webhook | Mention paid status + onboarding step | “Verified webhooks mark the lead paid and trigger onboarding.” |
| 1:55 | Dashboard | Show AG Grid row → Paid | “Ops sees every lead, quote, and PayPal order in one dashboard.” |
| 2:10 | Architecture | Simple diagram: Chat → Quote engine → PayPal → Webhook → CRM row | “PayPal is central: create order, capture, webhook—not a logo in the footer.” |
| 2:25 | Close | Devpost + GitHub + Render deploy note | “Open source MIT, Render-ready, sandbox credentials for judges in the README.” |

## Live sandbox variant (when credentials added)

1. Set `.env.local` from `.env.example`.
2. Re-record payment segment with real PayPal Smart Buttons (sandbox buyer account from README).
3. Show PayPal Developer dashboard webhook delivery log (optional B-roll).

## Judge checklist callouts

- [ ] Demo mode works without secrets
- [ ] PayPal deposit flow completes
- [ ] Lead status becomes `paid`
- [ ] Dashboard reflects payment
- [ ] Light and dark themes
- [ ] Mobile width 375px (phone capture optional)
