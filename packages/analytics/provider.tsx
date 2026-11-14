import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

interface AnalyticsProviderProps {
  readonly children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => (
  <>
    {children}
    <VercelAnalytics />
  </>
);
