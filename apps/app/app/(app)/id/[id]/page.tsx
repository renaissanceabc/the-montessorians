import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getChanges, pathForResolved, resolveId } from "@/lib/content/authority";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";

// /id/<id> is the permanent URI for every record. Live and merged records are
// redirected (308) by next.config before reaching this page; it renders the
// notice for withdrawn records, and redirects as a fallback in development.

export function generateStaticParams() {
  const ids = [
    ...getAllProfiles().map((p) => p.id),
    ...getAllOrganizations().map((o) => o.id),
    ...getChanges()
      .filter((c) => c.action !== "renamed")
      .map((c) => c.id),
  ];
  return ids.map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return createMetadata({
    title: `Record ${id}`,
    description: `Permanent identifier ${id} in The Montessorians.`,
    robots: { index: false, follow: true },
  });
}

export default async function IdPage({ params }: { params: Promise<{ id: string }> }) {
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
    <div className="container mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="font-mono text-muted-foreground text-sm">{id}</p>
      <h1 className="font-semibold font-serif text-4xl">
        {change.name ?? "This record"} was withdrawn
      </h1>
      <p className="text-muted-foreground">
        Withdrawn on {change.date}
        {change.reason ? `: ${change.reason}` : "."} The identifier stays reserved and will not be
        reused.
      </p>
      <Link className="text-sm underline" href="/discover">
        Explore the directory
      </Link>
    </div>
  );
}
