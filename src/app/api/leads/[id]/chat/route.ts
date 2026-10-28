import { NextResponse } from "next/server";
import { runAgentTurn } from "@/lib/agent/closer";
import { addMessage, getLead, updateLead } from "@/lib/db";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const lead = getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const body = (await req.json()) as { message?: string };
  const userText = body.message?.trim();
  if (!userText) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  addMessage(id, "user", userText);
  const reply = await runAgentTurn(lead, userText);

  if (reply.leadPatch) {
    updateLead(id, reply.leadPatch);
  }
  if (reply.quote) {
    updateLead(id, { quote: reply.quote, status: "quoted" });
  }

  addMessage(id, "assistant", reply.message);
  const updated = getLead(id);

  return NextResponse.json({
    message: reply.message,
    lead: updated,
    readyForCheckout: reply.readyForCheckout,
  });
}
