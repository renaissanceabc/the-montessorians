import "./globals.css";
import { AnalyticsProvider } from "@repo/analytics/provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { fonts } from "@/lib/fonts";
import Footer from "../components/footer";
import Header from "../components/header";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${fonts} bg-background antialiased`}>
        <NuqsAdapter>
          <Suspense fallback={null}>
            <AnalyticsProvider>
              <Header />
              <main>{children}</main>
              <Footer />
              <Toaster richColors />
            </AnalyticsProvider>
          </Suspense>
        </NuqsAdapter>
      </body>
    </html>
  );
}
