import { HomeIcon, SearchIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import { Button } from "@/components/ui/button";
import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  description: "There is no page at this address.",
  title: "Page Not Found",
});

/**
 * Every unknown address lands here, including a mistyped profile: the static
 * routes set dynamicParams to false, so their own not-found pages never run.
 */
const NotFoundPage = () => (
  <Container className="flex flex-col items-start gap-8 pt-6 pb-24 lg:pt-8" size="reading">
    <div className="flex flex-col gap-3">
      <h1 className="type-title">Page not found</h1>
      <p className="type-lead">
        There&apos;s no page at this address. The link may have a typo, or the page may have moved.
      </p>
    </div>

    <div className="flex flex-wrap gap-3">
      <Button
        className="shadow-none"
        nativeButton={false}
        render={<Link href="/discover" />}
        size="lg"
      >
        <SearchIcon aria-hidden="true" className="size-4" />
        Search the directory
      </Button>
      <Button
        className="shadow-none"
        nativeButton={false}
        render={<Link href="/" />}
        size="lg"
        variant="outline"
      >
        <HomeIcon aria-hidden="true" className="size-4" />
        Back to home
      </Button>
    </div>
  </Container>
);
export default NotFoundPage;
