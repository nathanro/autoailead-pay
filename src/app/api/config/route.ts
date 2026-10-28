import { NextResponse } from "next/server";
import { getAppMode } from "@/lib/config";
import { BUSINESS, SERVICES } from "@/lib/business-config";

export async function GET() {
  const mode = getAppMode();
  return NextResponse.json({
    business: {
      name: BUSINESS.name,
      tagline: BUSINESS.tagline,
      facts: BUSINESS.verifiedFacts,
    },
    services: SERVICES.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      basePrice: s.basePriceCents / 100,
      depositPercent: s.depositPercent,
      maxDiscountPercent: s.maxDiscountPercent,
    })),
    mode,
  });
}
