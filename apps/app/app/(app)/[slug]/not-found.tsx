import { ArrowLeftIcon, HomeIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const generateMetadata = () =>
  createMetadata({
    description: "The Montessorian you are looking for does not exist.",
    title: "Montessorian Not Found",
  });

const NotFoundPage = () => (
  <Container className="flex flex-col items-start gap-8 pt-6 pb-24 lg:pt-8" size="reading">
    <Link
      className="text-muted-foreground flex flex-row items-center gap-2 text-sm hover:underline"
      href="/discover"
    >
      <ArrowLeftIcon aria-hidden="true" className="size-4" />
      Back to Montessorians
    </Link>

    <div className="flex flex-col gap-3">
      <h1 className="type-title">Montessorian not found</h1>
      <p className="type-lead">Sadly, the Montessorian you are looking for does not exist.</p>
    </div>

    <Button className="shadow-none" nativeButton={false} render={<Link href="/" />} size="lg">
      <HomeIcon aria-hidden="true" className="size-4" />
      Back to home
    </Button>
  </Container>
);
export default NotFoundPage;
