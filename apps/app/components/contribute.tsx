"use client";

import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const Contribute = () => (
  <section className="container mx-auto flex max-w-screen-md flex-col justify-between gap-10 border-t border-t-black/10 px-4 py-12 sm:px-8 md:flex-row md:items-center">
    <div className="flex w-full flex-col items-center justify-between gap-4">
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Contribute to the directory</h1>
        <p className="text-muted-foreground text-sm sm:max-w-lg">
          The Montessorians is the largest open source dataset of Montessori alumni and the people
          who shaped the field. Help us grow by adding someone you know, or yourself.
        </p>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <Button
          className="border-black/10 bg-white/75 shadow-none"
          nativeButton={false}
          render={<Link href="/contribute" />}
          size="lg"
          variant="outline"
        >
          <UserPlusIcon className="h-4 w-4" />
          Add a Montessorian
        </Button>
      </div>
    </div>
  </section>
);

export default Contribute;
