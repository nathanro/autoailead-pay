export type LeadStatus =
  | "new"
  | "qualifying"
  | "quoted"
  | "checkout"
  | "paid"
  | "onboarding";

export interface QuoteLineItem {
  label: string;
  amountCents: number;
}

export interface Quote {
  serviceId: string;
  serviceName: string;
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  depositPercent: number;
  depositCents: number;
  currency: "USD";
  validDays: number;
  notes: string;
}

export interface Lead {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  serviceInterest: string | null;
  budgetRange: string | null;
  timeline: string | null;
  status: LeadStatus;
  quote: Quote | null;
  paypalOrderId: string | null;
  amountCents: number | null;
  currency: string;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}

export interface LeadMessage {
  id: string;
  leadId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface AgentReply {
  message: string;
  leadPatch?: Partial<
    Pick<
      Lead,
      | "name"
      | "email"
      | "company"
      | "serviceInterest"
      | "budgetRange"
      | "timeline"
      | "status"
    >
  >;
  quote?: Quote | null;
  readyForCheckout?: boolean;
}

export interface AppMode {
  demoMode: boolean;
  paypalConfigured: boolean;
  llmConfigured: boolean;
  paypalEnv: "sandbox" | "live";
  paypalClientId: string | null;
}
