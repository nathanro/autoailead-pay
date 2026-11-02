"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/types";

function CheckoutReturnInner() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get("leadId");
  const token = searchParams.get("token");
  const [state, setState] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [lead, setLead] = useState<Lead | null>(null);

  useEffect(() => {
    if (!leadId) {
      setState("error");
      setMessage("Missing leadId in return URL.");
      return;
    }

    void (async () => {
      try {
        const leadRes = await fetch(`/api/leads/${leadId}`);
        if (!leadRes.ok) throw new Error("Lead not found");
        const leadData = (await leadRes.json()) as { lead: Lead };
        const orderId =
          token ?? leadData.lead.paypalOrderId ?? searchParams.get("orderId");
        if (!orderId) {
          throw new Error("No PayPal order id on return (approve the order first).");
        }

        const captureRes = await fetch("/api/paypal/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, leadId }),
        });
        const captureData = (await captureRes.json()) as {
          lead?: Lead;
          error?: string;
        };
        if (!captureRes.ok) {
          throw new Error(captureData.error ?? "Capture failed");
        }
        setLead(captureData.lead ?? leadData.lead);
        setState("success");
        setMessage("Deposit captured. Your project is marked paid.");
      } catch (e) {
        setState("error");
        setMessage(e instanceof Error ? e.message : "Checkout return failed");
      }
    })();
  }, [leadId, token, searchParams]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>
          {state === "loading"
            ? "Confirming PayPal payment…"
            : state === "success"
              ? "Payment successful"
              : "Payment issue"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>{message}</p>
        {lead?.status === "paid" ? (
          <p className="text-foreground">
            Onboarding step {lead.onboardingStep}/3 has started.
          </p>
        ) : null}
        <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
          Back to chat
        </Link>
      </CardContent>
    </Card>
  );
}

export default function CheckoutReturnPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <CheckoutReturnInner />
    </Suspense>
  );
}
