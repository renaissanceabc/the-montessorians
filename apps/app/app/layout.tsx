import "./globals.css";
import { AnalyticsProvider } from "@montessorians/analytics/provider";
import type { Metadata } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";

import { DevTools } from "@/components/dev-tools";
import { Toaster } from "@/components/ui/sonner";
import { fonts } from "@/lib/fonts";
import { feedAlternates } from "@/lib/metadata";

import Footer from "../components/footer";
import Header from "../components/header";

// Pages built with createMetadata advertise the feed too; this covers the rest.
export const metadata: Metadata = {
  alternates: feedAlternates,
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={`${fonts} bg-background antialiased`}>
      <a
        className="bg-primary text-primary-foreground fixed top-3 left-3 z-200 -translate-y-24 rounded-full px-4 py-2 text-sm font-semibold focus-visible:translate-y-0"
        data-print-hidden
        href="#main"
      >
        Skip to content
      </a>
      <NuqsAdapter>
        <Suspense fallback={null}>
          <AnalyticsProvider>
            <Header />
            <main className="scroll-mt-24 focus:outline-none" id="main" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <Toaster richColors />
            <DevTools />
          </AnalyticsProvider>
        </Suspense>
      </NuqsAdapter>
    </body>
  </html>
);
export default RootLayout;
