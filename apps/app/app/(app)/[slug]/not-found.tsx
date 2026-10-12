import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = () =>
  createMetadata({
    description: "The Montessorian you are looking for does not exist.",
    title: "Montessorian Not Found",
  });

const NotFoundPage = () => (
  <div className="container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-10 px-4 pb-12 sm:px-8">
    <div className="grid w-full items-center justify-items-center gap-10">
      <Link
        className="text-muted-foreground flex flex-row items-center gap-2 text-sm hover:underline"
        href="/discover"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Montessorians
      </Link>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-4">
          <h1 className="flex w-full justify-center font-serif text-5xl font-bold">
            Montessorian not found
          </h1>
          <p className="text-muted-foreground text-lg">
            Sadly, the Montessorian you are looking for does not exist.
          </p>
        </div>

        <Button className="shadow-none" nativeButton={false} render={<Link href="/" />} size="lg">
          <HomeIcon className="h-4 w-4" />
          Back to home
        </Button>
      </div>
    </div>
  </div>
);
export default NotFoundPage;
