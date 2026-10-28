import { LeadsDashboardGrid } from "@/components/leads-dashboard";

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Leads dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track qualification, quotes, PayPal orders, and paid onboarding status.
        </p>
      </div>
      <LeadsDashboardGrid />
    </div>
  );
}
