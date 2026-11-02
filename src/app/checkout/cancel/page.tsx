import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function CheckoutCancelPage() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>PayPal checkout canceled</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          No charge was made. You can return to the chat and try again when
          ready.
        </p>
        <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
          Continue conversation
        </Link>
      </CardContent>
    </Card>
  );
}
