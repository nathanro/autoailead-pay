import { NextResponse } from "next/server";
import { getLead, getMessages } from "@/lib/db";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const lead = getLead(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const messages = getMessages(id);
  return NextResponse.json({ lead, messages });
}
