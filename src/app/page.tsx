import { connection } from "next/server";
import { LeadChatExperience } from "@/components/lead-chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getAppMode } from "@/lib/config";

export default async function HomePage() {
  await connection();
  const mode = getAppMode();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Close leads with AI—not calendar links
          </h1>
          {mode.demoMode ? <Badge variant="secondary">Demo mode</Badge> : null}
        </div>
        <p className="max-w-3xl text-muted-foreground">
          AutoAI Lead Pay is a full-cycle AI closer for agencies and SMBs in the
          US and LatAm. It qualifies inbound interest, handles price and trust
          objections using verified business rules, generates a tailored quote,
          and collects the deposit through PayPal—end to end.
        </p>
      </section>

      <Card className="border-dashed bg-muted/30">
        <CardContent className="grid gap-2 pt-6 text-sm sm:grid-cols-3">
          <div>
            <p className="font-medium">Guardrailed quotes</p>
            <p className="text-muted-foreground">
              Never invents discounts beyond configured limits.
            </p>
          </div>
          <div>
            <p className="font-medium">PayPal-native</p>
            <p className="text-muted-foreground">
              Orders v2 checkout + verified webhooks mark leads paid.
            </p>
          </div>
          <div>
            <p className="font-medium">Onboarding trigger</p>
            <p className="text-muted-foreground">
              Paid status kicks off onboarding steps automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      <LeadChatExperience initialMode={mode} />
    </div>
  );
}
