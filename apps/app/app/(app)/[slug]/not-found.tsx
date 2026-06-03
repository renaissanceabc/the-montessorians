import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = async () => {
  return createMetadata({
    title: "Montessorian Not Found",
    description: "The Montessorian you are looking for does not exist.",
  });
};

export default function NotFoundPage({}) {
  return (
    <div className="container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-10 px-4 pb-12 sm:px-8">
      <div className="grid w-full items-center justify-items-center gap-10">
        <Link
          className="flex flex-row items-center gap-2 text-muted-foreground text-sm hover:underline"
          href="/discover"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Montessorians
        </Link>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-4">
            <h1 className="flex w-full justify-center font-bold font-serif text-5xl">
              Montessorian not found
            </h1>
            <p className="text-lg text-muted-foreground">
              Sadly, the Montessorian you are looking for does not exist.
            </p>
          </div>

          <Button asChild className="shadow-none" size="lg">
            <Link href="/">
              <HomeIcon className="h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
