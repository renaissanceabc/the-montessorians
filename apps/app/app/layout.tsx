import "./globals.css";
import { AnalyticsProvider } from "@montessorians/analytics/provider";
import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";

import { DevTools } from "@/components/dev-tools";
import { SafariEdges } from "@/components/safari-edges";
import { Toaster } from "@/components/ui/sonner";
import { fonts } from "@/lib/fonts";
import { feedAlternates } from "@/lib/metadata";
import { PAGE_EDGE_COLOR } from "@/lib/safari-edges";

import Footer from "../components/footer";
import Header from "../components/header";

// Pages built with createMetadata advertise the feed too; this covers the rest.
export const metadata: Metadata = {
  alternates: feedAlternates,
};

export const viewport: Viewport = {
  initialScale: 1,
  themeColor: PAGE_EDGE_COLOR,
  viewportFit: "cover",
  width: "device-width",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={`${fonts} antialiased`}>
      {/* Beige page paint. The body itself takes the bottom-edge color so the
          rubber-band below the footer matches the footer, not the page. */}
      <div className="bg-background" data-page-surface>
        <a
          className="bg-primary text-primary-foreground fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-[max(0.75rem,env(safe-area-inset-left,0px))] z-200 -translate-y-24 rounded-full px-4 py-2 text-sm font-semibold focus-visible:translate-y-0"
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
      </div>
      <SafariEdges />
    </body>
  </html>
);
export default RootLayout;
