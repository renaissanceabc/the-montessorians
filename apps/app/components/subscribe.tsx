"use client";

import { useMutation } from "@tanstack/react-query";
import { MailCheckIcon, MailPlusIcon } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmailSchema } from "@/lib/validation/email";
import { useTRPC } from "@/trpc/client";

export default function Subscribe() {
  const trpc = useTRPC();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const subscribe = useMutation(trpc.subscriptions.subscribe.mutationOptions());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLocalError(null);

    const result = EmailSchema.safeParse({ email });
    if (!result.success) {
      setLocalError(result.error.format().email?._errors[0] || "Invalid email");
      return;
    }

    subscribe.mutate({ email });
  };

  const status: "idle" | "loading" | "success" | "error" = (() => {
    if (subscribe.isPending) {
      return "loading";
    }
    if (subscribe.isSuccess) {
      return "success";
    }
    if (subscribe.isError || localError) {
      return "error";
    }
    return "idle";
  })();

  const error = localError ?? (subscribe.error?.message || null);

  const statusText = useMemo(() => {
    if (status === "loading") {
      return "Subscribing...";
    }
    return "Subscribe";
  }, [status]);

  return (
    <section className="container mx-auto flex max-w-screen-md flex-col justify-between gap-10 border-y border-y-black/10 px-4 py-12 sm:px-8 md:flex-row md:items-center">
      <div className="flex w-full flex-col items-center justify-between gap-4">
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="font-bold font-serif text-3xl sm:text-4xl">Join The Montessorians</h1>
          <p className="text-muted-foreground text-sm sm:max-w-lg">
            Subscribe to our newsletter to join a growing community passionate about Montessori and
            alternative education.
          </p>
        </div>

        <div className="flex w-full max-w-md flex-col items-center gap-2 md:flex-row md:items-start">
          <form className="flex w-full flex-row gap-1" onSubmit={handleSubmit}>
            <div className="flex flex-1 flex-col gap-1">
              <Input
                className={cn(
                  "border-black/10 bg-white/75 shadow-none",
                  status === "error" && "border-destructive"
                )}
                disabled={status === "loading"}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                value={email}
              />
              {error && <p className="text-destructive text-xs">{error}</p>}
              {status === "success" && <p className="text-green-700 text-xs">You're subscribed!</p>}
            </div>

            <Button
              className="cursor-pointer border-black/10 bg-white/75 shadow-none"
              disabled={status === "loading"}
              type="submit"
              variant="outline"
            >
              {status === "success" ? (
                <MailCheckIcon className="h-4 w-4" />
              ) : (
                <MailPlusIcon className="h-4 w-4" />
              )}
              {statusText}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
