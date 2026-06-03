"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <section className="rounded-lg border border-black/10 bg-white/50 py-8">
      <div className="container mx-auto flex flex-col items-center gap-4 px-4 sm:px-8">
        <div className="flex w-full flex-col gap-2 text-center">
          <h1 className="font-bold font-serif text-4xl">About The Montessorians</h1>
          <p className="mx-auto text-muted-foreground text-sm sm:max-w-100">
            Daily spotlight and a growing directory of Montessori alumni who've gone on to do great
            things. <strong>Open source</strong>.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <Button asChild className="border-black/10 shadow-none" size="lg" variant="secondary">
            <Link className="shadow-none" href="/about">
              Learn more
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
