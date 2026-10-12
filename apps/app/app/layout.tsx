import "./globals.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";

import { DevTools } from "@/components/dev-tools";
import { Toaster } from "@/components/ui/sonner";
import { fonts } from "@/lib/fonts";

import Footer from "../components/footer";
import Header from "../components/header";

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body className={`${fonts} bg-background antialiased`}>
      <NuqsAdapter>
        <Suspense fallback={null}>
          <AnalyticsProvider>
            <Header />
            <main>{children}</main>
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
