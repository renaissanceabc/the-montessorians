"use client";

import { parseError } from "@montessorians/observability/error";
import { HomeIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/container";
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
    <Container className="flex flex-col items-start gap-8 pt-6 pb-24 lg:pt-8" size="reading">
      <div className="flex flex-col gap-3">
        <h1 className="type-title">Something went wrong</h1>
        <p className="type-lead">
          This page didn&apos;t load properly. Try again, and if it keeps happening, head back home.
        </p>
        {error.digest && <p className="type-meta font-mono">Error reference: {error.digest}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="shadow-none" onClick={reset} size="lg">
          <RotateCcwIcon aria-hidden="true" className="size-4" />
          Try again
        </Button>
        <Button
          className="shadow-none"
          nativeButton={false}
          render={<Link href="/" />}
          size="lg"
          variant="outline"
        >
          <HomeIcon aria-hidden="true" className="size-4" />
          Back to home
        </Button>
      </div>
    </Container>
  );
};
export default ErrorPage;
