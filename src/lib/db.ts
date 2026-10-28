import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Lead, LeadMessage, LeadStatus, Quote } from "@/lib/types";

function resolveDbPath(): string {
  if (process.env.LEADS_DB_PATH) return process.env.LEADS_DB_PATH;
  return path.join(process.cwd(), "data", "leads.db");
}

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  const dbPath = resolveDbPath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      company TEXT,
      service_interest TEXT,
      budget_range TEXT,
      timeline TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      quote_json TEXT,
      paypal_order_id TEXT,
      amount_cents INTEGER,
      currency TEXT DEFAULT 'USD',
      onboarding_step INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS lead_messages (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as string,
    name: (row.name as string) ?? null,
    email: (row.email as string) ?? null,
    company: (row.company as string) ?? null,
    serviceInterest: (row.service_interest as string) ?? null,
    budgetRange: (row.budget_range as string) ?? null,
    timeline: (row.timeline as string) ?? null,
    status: row.status as LeadStatus,
    quote: row.quote_json
      ? (JSON.parse(row.quote_json as string) as Quote)
      : null,
    paypalOrderId: (row.paypal_order_id as string) ?? null,
    amountCents: row.amount_cents != null ? Number(row.amount_cents) : null,
    currency: (row.currency as string) ?? "USD",
    onboardingStep: Number(row.onboarding_step ?? 0),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function createLead(): Lead {
  const id = randomUUID();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO leads (id, status, created_at, updated_at) VALUES (?, 'qualifying', ?, ?)`,
    )
    .run(id, now, now);
  addMessage(id, "assistant", getWelcomeMessage());
  return getLead(id)!;
}

function getWelcomeMessage(): string {
  return `Hi! I'm the BrightPath AI closer. I'll ask a few quick questions, share a quote backed by our real pricing rules, and you can pay your deposit with PayPal when you're ready. What service are you interested in—landing page, paid ads setup, or our full funnel package?`;
}

export function getLead(id: string): Lead | null {
  const row = getDb().prepare(`SELECT * FROM leads WHERE id = ?`).get(id);
  return row ? rowToLead(row as Record<string, unknown>) : null;
}

export function listLeads(): Lead[] {
  const rows = getDb()
    .prepare(`SELECT * FROM leads ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map(rowToLead);
}

export function updateLead(
  id: string,
  patch: Partial<{
    name: string | null;
    email: string | null;
    company: string | null;
    serviceInterest: string | null;
    budgetRange: string | null;
    timeline: string | null;
    status: LeadStatus;
    quote: Quote | null;
    paypalOrderId: string | null;
    amountCents: number | null;
    onboardingStep: number;
  }>,
): Lead | null {
  const existing = getLead(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const merged = {
    name: patch.name !== undefined ? patch.name : existing.name,
    email: patch.email !== undefined ? patch.email : existing.email,
    company: patch.company !== undefined ? patch.company : existing.company,
    serviceInterest:
      patch.serviceInterest !== undefined
        ? patch.serviceInterest
        : existing.serviceInterest,
    budgetRange:
      patch.budgetRange !== undefined ? patch.budgetRange : existing.budgetRange,
    timeline: patch.timeline !== undefined ? patch.timeline : existing.timeline,
    status: patch.status ?? existing.status,
    quote: patch.quote !== undefined ? patch.quote : existing.quote,
    paypalOrderId:
      patch.paypalOrderId !== undefined
        ? patch.paypalOrderId
        : existing.paypalOrderId,
    amountCents:
      patch.amountCents !== undefined ? patch.amountCents : existing.amountCents,
    onboardingStep: patch.onboardingStep ?? existing.onboardingStep,
  };

  getDb()
    .prepare(
      `UPDATE leads SET
        name = ?, email = ?, company = ?, service_interest = ?, budget_range = ?,
        timeline = ?, status = ?, quote_json = ?, paypal_order_id = ?,
        amount_cents = ?, onboarding_step = ?, updated_at = ?
      WHERE id = ?`,
    )
    .run(
      merged.name,
      merged.email,
      merged.company,
      merged.serviceInterest,
      merged.budgetRange,
      merged.timeline,
      merged.status,
      merged.quote ? JSON.stringify(merged.quote) : null,
      merged.paypalOrderId,
      merged.amountCents,
      merged.onboardingStep,
      now,
      id,
    );
  return getLead(id);
}

export function addMessage(
  leadId: string,
  role: LeadMessage["role"],
  content: string,
): LeadMessage {
  const msg: LeadMessage = {
    id: randomUUID(),
    leadId,
    role,
    content,
    createdAt: new Date().toISOString(),
  };
  getDb()
    .prepare(
      `INSERT INTO lead_messages (id, lead_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(msg.id, msg.leadId, msg.role, msg.content, msg.createdAt);
  return msg;
}

export function getMessages(leadId: string): LeadMessage[] {
  const rows = getDb()
    .prepare(
      `SELECT * FROM lead_messages WHERE lead_id = ? ORDER BY created_at ASC`,
    )
    .all(leadId) as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    leadId: r.lead_id as string,
    role: r.role as LeadMessage["role"],
    content: r.content as string,
    createdAt: r.created_at as string,
  }));
}

export function resetDbConnection(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export function markLeadPaidFromWebhook(
  paypalOrderId: string,
  amountCents?: number,
): Lead | null {
  const row = getDb()
    .prepare(`SELECT * FROM leads WHERE paypal_order_id = ?`)
    .get(paypalOrderId) as Record<string, unknown> | undefined;
  if (!row) return null;
  return updateLead(row.id as string, {
    status: "paid",
    amountCents: amountCents ?? (row.amount_cents as number | null),
    onboardingStep: 1,
  });
}

export function advanceOnboarding(leadId: string): Lead | null {
  const lead = getLead(leadId);
  if (!lead || lead.status !== "paid") return null;
  const next = Math.min(lead.onboardingStep + 1, 3);
  const status = next >= 3 ? "onboarding" : "paid";
  return updateLead(leadId, { onboardingStep: next, status });
}
