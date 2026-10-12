"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

const About = () => (
  <section className="rounded-lg border border-black/10 bg-white/50 py-8">
    <div className="container mx-auto flex flex-col items-center gap-4 px-4 sm:px-8">
      <div className="flex w-full flex-col gap-2 text-center">
        <h1 className="font-serif text-4xl font-bold">About The Montessorians</h1>
        <p className="text-muted-foreground mx-auto text-sm sm:max-w-100">
          Daily spotlight and a growing directory of Montessori alumni who&apos;ve gone on to do
          great things. <strong>Open source</strong>.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Button
          className="border-black/10 shadow-none"
          nativeButton={false}
          render={<Link className="shadow-none" href="/about" />}
          size="lg"
          variant="secondary"
        >
          Learn more
        </Button>
      </div>
    </div>
  </section>
);
export default About;
