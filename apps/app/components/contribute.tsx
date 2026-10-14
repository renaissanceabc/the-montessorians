import { UserPlusIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { Container } from "./container";

/** The "add someone" call to action at the bottom of a page. */
const Contribute = ({ size = "wide" }: { size?: "wide" | "reading" }) => (
  <Container as="section" data-print-hidden size={size}>
    <div className="flex flex-col gap-6 border-t border-t-black/10 py-12 md:flex-row md:items-center md:justify-between md:gap-10">
      <div className="flex max-w-xl flex-col gap-2">
        <h2 className="type-section">Contribute to the directory</h2>
        <p className="text-muted-foreground text-sm text-pretty">
          The Montessorians is the largest open source dataset of Montessori alumni and the people
          who shaped the field. Help us grow by adding someone you know, or yourself.
        </p>
      </div>

      <Button
        className="w-fit shrink-0 border-black/10 bg-white/75 shadow-none"
        nativeButton={false}
        render={<Link href="/contribute" />}
        size="lg"
        variant="outline"
      >
        <UserPlusIcon aria-hidden="true" className="size-4" />
        Add a Montessorian
      </Button>
    </div>
  </Container>
);

export default Contribute;
