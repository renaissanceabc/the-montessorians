"use client";

import { parseError } from "@repo/observability/error";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import type NextError from "next/error";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { fonts } from "@/lib/fonts";

type GlobalErrorProperties = {
  readonly error: NextError & { digest?: string };
  readonly reset: () => void;
};

const GlobalError = ({ error, reset }: GlobalErrorProperties) => {
  useEffect(() => {
    parseError(error);
  }, [error]);

  return (
    <html className={fonts} lang="en">
      <body className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            <div className="space-y-2">
              <h1 className="font-bold text-2xl text-gray-900">Critical Error</h1>
              <p className="text-gray-600">
                The application encountered a critical error. Please try refreshing the page.
              </p>
            </div>

            <div className="flex gap-3">
              <Button className="flex items-center gap-2" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                className="flex items-center gap-2"
                onClick={() => {
                  window.location.href = "/";
                }}
                variant="outline"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default GlobalError;
