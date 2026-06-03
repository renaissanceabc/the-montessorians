"use client";

import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export default function UnsubscribeClientContent({ token }: { token: string | undefined }) {
  const trpc = useTRPC();

  const unsubscribe = useMutation(trpc.subscriptions.unsubscribe.mutationOptions());

  const status: "idle" | "loading" | "success" | "error" = (() => {
    if (unsubscribe.isPending) {
      return "loading";
    }
    if (unsubscribe.isSuccess) {
      return "success";
    }
    if (unsubscribe.isError) {
      return "error";
    }
    return "idle";
  })();

  const buttonText = useMemo(() => {
    if (status === "loading") {
      return "Unsubscribing...";
    }
    if (status === "success") {
      return "Unsubscribed";
    }
    return "Yes, I'm sure";
  }, [status]);

  const handleUnsubscribe = () => {
    if (!token) {
      return;
    }
    unsubscribe.mutate({ token });
  };

  return (
    <div className="flex w-full flex-col items-center space-y-4 py-12 text-center">
      <h1 className="font-bold font-serif text-4xl lg:text-5xl">Unsubscribe</h1>

      {token ? (
        <>
          <p className="max-w-lg text-lg text-muted-foreground">
            Are you sure you want to unsubscribe? You will no longer receive daily Montessori
            stories.
          </p>

          <div className="flex flex-col items-center justify-center gap-4">
            <Button
              disabled={status === "loading" || status === "success"}
              onClick={handleUnsubscribe}
            >
              {buttonText}
            </Button>

            {status === "success" && (
              <p className="text-muted-foreground text-xs">
                You've been unsubscribed. You won't receive any more emails from us.
              </p>
            )}
            {status === "error" && (
              <p className="text-muted-foreground text-xs">
                There was an error processing your unsubscribe request.
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="max-w-lg text-lg text-muted-foreground">
          Invalid token. Please check your email for the correct link.
        </p>
      )}
    </div>
  );
}
