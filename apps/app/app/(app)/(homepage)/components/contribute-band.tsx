import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/** The homepage's compact "add someone" card. */
const ContributeBand = () => (
  <section
    aria-labelledby="home-contribute"
    className="flex flex-col gap-5 rounded-2xl border border-black/8 bg-white/55 p-6 sm:p-8 md:flex-row md:items-center md:justify-between md:gap-10"
    data-print-hidden
  >
    <div className="flex max-w-xl flex-col gap-2">
      <h2 className="type-section" id="home-contribute">
        Know a Montessorian we’re missing?
      </h2>
      <p className="text-muted-foreground text-[15px] text-pretty">
        Add someone you know, or yourself. A maintainer checks every source before it’s published.
      </p>
    </div>

    <Button
      className="h-11 px-4 shadow-none max-md:w-full"
      nativeButton={false}
      render={<Link href="/contribute" />}
      size="lg"
    >
      <UserPlusIcon aria-hidden="true" className="size-4" />
      Add a Montessorian
    </Button>
  </section>
);
export default ContributeBand;
