"use client";

import { useCallback, useRef, useState } from "react";
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
  const [approveUrl, setApproveUrl] = useState<string | null>(null);
  const orderRef = useRef<string | null>(null);

  const createOrderOnServer = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/paypal/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });
    const data = (await res.json()) as {
      order?: { id: string; approveUrl?: string };
      error?: string;
    };
    if (!res.ok) throw new Error(data.error ?? "Could not create order");
    orderRef.current = data.order!.id;
    if (data.order?.approveUrl) setApproveUrl(data.order.approveUrl);
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
      const orderId = await createOrderOnServer();
      await finalizePayment(orderId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  };

  const startRedirectCheckout = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/paypal/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = (await res.json()) as {
        order?: { id: string; approveUrl?: string };
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not create order");
      if (!data.order?.approveUrl) {
        throw new Error("PayPal did not return an approve link.");
      }
      window.location.href = data.order.approveUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start PayPal");
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
              Set PAYPAL_SANDBOX_CLIENT_ID and PAYPAL_SANDBOX_CLIENT_SECRET for
              real sandbox Smart Buttons.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <PayPalScriptProvider
              options={{
                clientId: paypalClientId,
                currency: lead.quote.currency,
                intent: "capture",
              }}
            >
              <PayPalButtons
                style={{ layout: "vertical", shape: "rect" }}
                createOrder={createOrderOnServer}
                onApprove={async (data) => {
                  setBusy(true);
                  try {
                    await finalizePayment(data.orderID);
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Capture failed",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
                onError={() => setError("PayPal checkout error")}
              />
            </PayPalScriptProvider>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={busy}
              onClick={() => void startRedirectCheckout()}
            >
              {busy ? "Redirecting…" : "Pay on PayPal (approve link)"}
            </Button>
            {approveUrl ? (
              <p className="text-xs text-muted-foreground break-all">
                Approve URL ready (also used by redirect button above).
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
