import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export function SiteHeader({ demoMode }: { demoMode?: boolean }) {
  return (
    <header className="border-b bg-card/80 backdrop-blur supports-backdrop-filter:bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Link href="/" className="font-semibold tracking-tight">
            AutoAI Lead Pay
          </Link>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            AI closer with PayPal deposits · Hackathon MVP
          </p>
        </div>
        <nav className="flex shrink-0 items-center gap-2 sm:gap-3">
          {demoMode ? (
            <Badge variant="secondary" className="hidden xs:inline-flex">
              Demo mode
            </Badge>
          ) : null}
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Dashboard
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
