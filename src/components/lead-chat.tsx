"use client";

import { useEffect, useRef, useState } from "react";
import { PayPalCheckoutPanel } from "@/components/paypal-checkout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppMode, Lead, LeadMessage } from "@/lib/types";

function formatMessage(text: string) {
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      <br />
    </span>
  ));
}

export function LeadChatExperience({
  initialMode,
}: {
  initialMode: AppMode;
}) {
  const [mode] = useState(initialMode);
  const [lead, setLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [readyForCheckout, setReadyForCheckout] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/leads", { method: "POST" });
      const data = (await res.json()) as { lead: Lead };
      setLead(data.lead);
      const msgRes = await fetch(`/api/leads/${data.lead.id}`);
      const msgData = (await msgRes.json()) as { messages: LeadMessage[] };
      setMessages(msgData.messages);
    })();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!lead || !input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);
    setMessages((m) => [
      ...m,
      {
        id: crypto.randomUUID(),
        leadId: lead.id,
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const res = await fetch(`/api/leads/${lead.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as {
        message: string;
        lead: Lead;
        readyForCheckout?: boolean;
      };
      setLead(data.lead);
      setReadyForCheckout(Boolean(data.readyForCheckout));
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          leadId: lead.id,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "We need a landing page for a LatAm SaaS launch",
    "Your price feels high—any discount?",
    "How do I know you're legit?",
    "We're busy until next month—is timing ok?",
    "Ready to pay the deposit",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card className="flex min-h-[480px] flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div>
            <CardTitle className="text-lg">AI closer chat</CardTitle>
            <p className="text-sm text-muted-foreground">
              Qualify → quote with guardrails → PayPal deposit
            </p>
          </div>
          {lead ? (
            <Badge variant="outline" className="shrink-0 capitalize">
              {lead.status}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3">
          <ScrollArea className="h-[340px] rounded-md border p-3">
            <div className="space-y-3 pr-2">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "mr-8 rounded-lg bg-muted px-3 py-2 text-sm"
                  }
                >
                  {formatMessage(m.content)}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((q) => (
              <Button
                key={q}
                type="button"
                variant="secondary"
                size="sm"
                className="h-auto whitespace-normal text-left text-xs"
                onClick={() => setInput(q)}
              >
                {q}
              </Button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell the agent about your project…"
              disabled={!lead || loading}
              aria-label="Chat message"
            />
            <Button type="submit" disabled={!lead || loading}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Mode:{" "}
              <strong className="text-foreground">
                {mode.demoMode ? "Demo / mock PayPal" : "PayPal sandbox"}
              </strong>
            </p>
            <p>
              LLM:{" "}
              <strong className="text-foreground">
                {mode.llmConfigured ? "Live" : "Rule-based demo agent"}
              </strong>
            </p>
            {lead?.quote ? (
              <p>
                Quote: ${(lead.quote.subtotalCents / 100).toFixed(0)} · Deposit $
                {(lead.quote.depositCents / 100).toFixed(2)}
              </p>
            ) : (
              <p>Complete qualification to unlock checkout.</p>
            )}
          </CardContent>
        </Card>

        {lead && (readyForCheckout || lead.quote) ? (
          <PayPalCheckoutPanel
            lead={lead}
            demoMode={mode.demoMode}
            paypalClientId={mode.paypalClientId}
            onPaid={setLead}
          />
        ) : null}
      </div>
    </div>
  );
}
