import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";
import { getAppMode } from "@/lib/config";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoAI Lead Pay | AI Closer with PayPal",
  description:
    "Qualify inbound leads, generate guarded quotes, and collect deposits with PayPal sandbox checkout.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const mode = getAppMode();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <SiteHeader demoMode={mode.demoMode} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
