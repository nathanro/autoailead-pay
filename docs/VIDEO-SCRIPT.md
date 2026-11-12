# Video script — AutoAI Lead Pay (max ~2:30)

**Format:** Screen recording + voiceover (English). **Music:** none (no copyrighted tracks).  
**Platform:** YouTube (public), under 3 minutes per hackathon rules.

---

## Pre-roll setup (not recorded)

- `npm run dev` → `http://localhost:43123`
- Light mode ON (show dark toggle briefly in one shot)
- Optional: sandbox creds in `.env.local` for real PayPal buttons; otherwise use **demo mode** throughout
- Second tab ready: `/dashboard`
- Close unrelated notifications

---

## Scene 1 — Hook (0:00–0:15)

| Shot | Action | VO |
|------|--------|-----|
| Title card or browser on home | Show headline “Close leads with AI—not calendar links” | “AutoAI Lead Pay is an AI closer for agencies: qualify, quote, and collect a deposit with PayPal—in one conversation.” |

---

## Scene 2 — Problem (0:15–0:25)

| Shot | Action | VO |
|------|--------|-----|
| Static slide or home hero | Highlight LatAm / SMB / agency | “Most chatbots stop at scheduling. Buyers want price, trust, and checkout.” |

---

## Scene 3 — Lead chat & qualification (0:25–0:50)

| Shot | Action | VO |
|------|--------|-----|
| Home chat panel | Click quick prompt: *“We need a landing page for a LatAm SaaS launch”* | “The agent qualifies the service and asks follow-ups.” |
| Chat | Optional: type name or timeline | “It stays inside verified business rules—no made-up offers.” |

---

## Scene 4 — Objection + quote (0:50–1:10)

| Shot | Action | VO |
|------|--------|-----|
| Chat | Prompt: *“Your price feels high—any discount?”* | “For price objections, it explains policy and max discount limits.” |
| Chat | Agent returns quote with deposit line | “Then it generates a quote with a forty-percent deposit in USD.” |
| Right column | Session card shows deposit amount | “Deposit amount is explicit before payment.” |

---

## Scene 5 — PayPal sandbox checkout (1:10–1:45)

| Shot | Action | VO |
|------|--------|-----|
| PayPal card | Click **Pay with PayPal** (demo button OR sandbox Smart Buttons) | “Checkout uses PayPal Orders v2—create, approve, and capture—not a fake pay link.” |
| PayPal (if sandbox) | Sandbox login as buyer (use README test account) | “In sandbox, the buyer approves on PayPal.” |
| App | Success: deposit received / status paid | “After capture, the lead status becomes paid.” |

**If demo mode only:** narrate that production uses the same API paths with sandbox credentials.

---

## Scene 6 — Return URL / capture (optional B-roll, 5 sec)

| Shot | Action | VO |
|------|--------|-----|
| `/checkout/return` briefly | Flash success message | “Redirect checkout captures on return URL when buyers use the approve link.” |

---

## Scene 7 — Webhook (1:45–1:55)

| Shot | Action | VO |
|------|--------|-----|
| Split: code editor on `api/webhooks/paypal` OR PayPal Developer webhook log (blur secrets) | Point at verification + paid status | “Verified webhooks on payment capture completed also mark leads paid and start onboarding.” |

---

## Scene 8 — Dashboard (1:55–2:10)

| Shot | Action | VO |
|------|--------|-----|
| `/dashboard` AG Grid | Row shows `paid`, order id, deposit | “Ops sees every lead and PayPal order in the AG Grid dashboard.” |

---

## Scene 9 — Architecture & close (2:10–2:28)

| Shot | Action | VO |
|------|--------|-----|
| README mermaid diagram or simple slide | Chat → Quote → PayPal → Webhook → DB | “PayPal is central: Orders and webhooks, sandbox-only for this hackathon.” |
| End card | GitHub + MIT + Devpost | “Open source MIT, Render-ready, built Oct through Nov twenty-twenty-six. Thanks for watching.” |

---

## Post checklist

- [ ] Total runtime ≤ 2:50 (buffer under 3:00)
- [ ] No background music
- [ ] No secrets on screen (env files, PayPal dashboard tokens)
- [ ] Upload to **YouTube** (public)
- [ ] Link video + repo on Devpost
