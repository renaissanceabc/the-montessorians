import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Container } from "@/components/container";
import { getChanges, pathForResolved, resolveId } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";

// /id/<id> is the permanent URI for every record. Live and merged records are
// redirected (308) by next.config before reaching this page; it renders the
// notice for withdrawn records, and redirects as a fallback in development.

export const generateStaticParams = () => {
  const ids = [
    ...getAllProfiles().map((p) => p.id),
    ...getAllOrganizations().map((o) => o.id),
    ...getChanges()
      .filter((c) => c.action !== "renamed")
      .map((c) => c.id),
  ];
  return ids.map((id) => ({ id }));
};

export const dynamicParams = false;

export const generateMetadata = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return createMetadata({
    description: `Permanent identifier ${id} in The Montessorians.`,
    robots: { follow: true, index: false },
    title: `Record ${id}`,
  });
};

const IdPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const resolved = resolveId(id);
  const path = pathForResolved(resolved);

  if (path) {
    permanentRedirect(path);
  }

  if (resolved?.kind !== "withdrawn") {
    notFound();
  }

  const { change } = resolved;
  return (
    <Container className="flex flex-col items-start gap-4 pt-6 pb-24 lg:pt-8" size="reading">
      <p className="text-muted-foreground font-mono text-sm">{id}</p>
      <h1 className="type-title">{change.name ?? "This record"} was withdrawn</h1>
      <p className="type-lead">
        Withdrawn on {change.date}
        {change.reason ? `: ${change.reason}` : "."} The identifier stays reserved and will not be
        reused.
      </p>
      <Link className="text-sm underline" href="/discover">
        Explore the directory
      </Link>
    </Container>
  );
};
export default IdPage;
