"use client";

import Link from "next/link";
import { GitHubIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default function Contribute() {
  return (
    <section className="container mx-auto flex max-w-screen-md flex-col justify-between gap-10 border-t border-t-black/10 px-4 py-12 sm:px-8 md:flex-row md:items-center">
      <div className="flex w-full flex-col items-center justify-between gap-4">
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="font-bold font-serif text-3xl sm:text-4xl">Contribute to the directory</h1>
          <p className="text-muted-foreground text-sm sm:max-w-lg">
            The Montessorians is the largest open source dataset of Montessori alumni. Help us grow
            by adding your Montessori story.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row">
          <Button
            asChild
            className="border-black/10 bg-white/75 shadow-none"
            size="lg"
            variant="outline"
          >
            <Link
              href="https://github.com/renaissanceabc/the-montessorians"
              rel="noopener noreferrer"
              target="_blank"
            >
              <GitHubIcon className="h-4 w-4" />
              Contribute
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
