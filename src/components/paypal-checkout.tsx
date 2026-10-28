"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Lead } from "@/lib/types";

interface Props {
  lead: Lead;
  demoMode: boolean;
  paypalClientId: string | null;
  onPaid: (lead: Lead) => void;
}

export function PayPalCheckoutPanel({
  lead,
  demoMode,
  paypalClientId,
  onPaid,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const orderRef = useRef<string | null>(null);

  const createOrder = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const data = (await res.json()) as {
      order?: { id: string };
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Could not create order");
    orderRef.current = data.order!.id;
    return data.order!.id;
  }, [lead.id]);

  const finalizePayment = useCallback(
    async (orderId: string) => {
      const captureRes = await fetch("/api/paypal/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, leadId: lead.id }),
      });
      const captureData = (await captureRes.json()) as {
        lead?: Lead;
        error?: string;
      };
      if (!captureRes.ok) {
        throw new Error(captureData.error ?? "Capture failed");
      }

      if (demoMode) {
        await fetch("/api/demo/simulate-webhook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, leadId: lead.id }),
        });
      }

      if (captureData.lead) onPaid(captureData.lead);
    },
    [demoMode, lead.id, onPaid],
  );

  const runMockCheckout = async () => {
    setBusy(true);
    setError(null);
    try {
      const orderId = await createOrder();
      await finalizePayment(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  if (!lead.quote) return null;

  const deposit = (lead.quote.depositCents / 100).toFixed(2);

  if (lead.status === "paid" || lead.status === "onboarding") {
    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="text-base">Deposit received</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          PayPal confirmed your ${deposit} deposit. Onboarding step{" "}
          {lead.onboardingStep}/3 is queued—check your email for kickoff
          details.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pay deposit with PayPal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Secure sandbox checkout for ${deposit} {lead.quote.currency} (
          {lead.quote.depositPercent}% of project total).
        </p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        {demoMode || !paypalClientId ? (
          <div className="space-y-2">
            <Button onClick={runMockCheckout} disabled={busy} className="w-full">
              {busy ? "Processing…" : "Pay with PayPal (demo sandbox UI)"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Demo mode uses mock orders and simulates the PayPal webhook locally.
              Add sandbox credentials to enable live PayPal Smart Buttons.
            </p>
          </div>
        ) : (
          <PayPalScriptProvider
            options={{
              clientId: paypalClientId,
              currency: lead.quote.currency,
              intent: "capture",
            }}
          >
            <PayPalButtons
              style={{ layout: "vertical", shape: "rect" }}
              createOrder={createOrder}
              onApprove={async (data) => {
                setBusy(true);
                try {
                  await finalizePayment(data.orderID);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Capture failed");
                } finally {
                  setBusy(false);
                }
              }}
              onError={() => setError("PayPal checkout error")}
            />
          </PayPalScriptProvider>
        )}
      </CardContent>
    </Card>
  );
}
