"use client";

import { parseError } from "@montessorians/observability/error";
import { HomeIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

/**
 * The error boundary for every page inside the site layout: the header and
 * footer stay, and the reader can retry or go home.
 */
const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    // Reports to Sentry when it's configured, and logs either way.
    parseError(error);
  }, [error]);

  return (
    <div className="container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-10 px-4 pt-8 pb-12 sm:px-8">
      <div className="flex w-full flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <h1 className="font-serif text-5xl font-bold">Something went wrong</h1>
          <p className="text-muted-foreground max-w-prose text-lg">
            This page didn&apos;t load properly. Try again, and if it keeps happening, head back
            home.
          </p>
          {error.digest && (
            <p className="text-muted-foreground font-mono text-xs">
              Error reference: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <Button className="shadow-none" onClick={reset} size="lg">
            <RotateCcwIcon className="h-4 w-4" />
            Try again
          </Button>
          <Button
            className="shadow-none"
            nativeButton={false}
            render={<Link href="/" />}
            size="lg"
            variant="outline"
          >
            <HomeIcon className="h-4 w-4" />
            Back to home
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ErrorPage;
