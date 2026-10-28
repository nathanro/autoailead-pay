import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/db";

export async function GET() {
  const leads = listLeads();
  return NextResponse.json({ leads });
}

export async function POST() {
  const lead = createLead();
  return NextResponse.json({ lead });
}
