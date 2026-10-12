import Link from "next/link";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { REPO_URL } from "@/lib/url";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () => {
  return createMetadata({
    title: "Data & API",
    description:
      "Permanent identifiers, bulk downloads, JSON-LD, and a reconciliation API for The Montessorians name authority.",
    alternates: {
      canonical: `${siteUrl}/data`,
    },
  });
};

const DOWNLOADS = [
  {
    href: "/data/people.json",
    label: "People (JSON)",
    note: "Every field, plus each record's permanent URI",
  },
  {
    href: "/data/people.jsonld",
    label: "People and organizations (JSON-LD)",
    note: "schema.org, with sameAs links to other authorities",
  },
  {
    href: "/data/people.csv",
    label: "People (CSV)",
    note: "One row per person, for spreadsheets and OpenRefine",
  },
  {
    href: "/data/organizations.json",
    label: "Organizations (JSON)",
    note: "Schools, training centers, universities, associations",
  },
  {
    href: "/data/changes.json",
    label: "Changes (JSON)",
    note: "Merged, withdrawn, and renamed records",
  },
];

export default function Data() {
  const people = getAllProfiles();
  const example = people.find((p) => p.kind === "contributor") ?? people[0];

  return (
    <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
      <div className="w-full space-y-8 pt-12 pb-16">
        <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
          Data &amp; API
        </h1>

        <div className="prose prose-stone max-w-none prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:whitespace-pre-wrap prose-pre:break-all">
          <p className="lead">
            The Montessorians is an open name authority for Montessori alumni and contributors:{" "}
            {people.length} people and {getAllOrganizations().length} organizations, dedicated to
            the public domain under{" "}
            <Link href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</Link>.
          </p>

          <h3>Permanent identifiers</h3>
          <p>
            Every record has an identifier that never changes and is never reused, even if the
            person's name or page address changes. Cite records by their URI:
          </p>
          {example && (
            <pre>
              <code>
                {siteUrl}/id/{example.id}
              </code>
            </pre>
          )}
          <p>
            It redirects to the record's current page. If a record is merged into another, its URI
            redirects to the surviving record; if it is withdrawn, the URI explains why. Person ids
            look like <code>tm0000001</code>; organization ids look like <code>tmo000001</code>.
          </p>

          <h3>Downloads</h3>
          <ul>
            {DOWNLOADS.map((d) => (
              <li key={d.href}>
                <Link href={d.href}>{d.label}</Link> — {d.note}
              </li>
            ))}
          </ul>
          <p>
            Each record is also available as JSON-LD at <code>/data/&lt;id&gt;</code>, and every
            profile page embeds the same JSON-LD. Versioned releases of the full dataset are
            published from <Link href={`${REPO_URL}/releases`}>GitHub releases</Link>.
          </p>

          <h3>Reconciliation API</h3>
          <p>
            Match your own list of names against this dataset with any client that speaks the{" "}
            <Link href="https://www.w3.org/community/reports/reconciliation/CG-FINAL-specs-0.2-20230410/">
              W3C Reconciliation Service API
            </Link>
            , such as <Link href="https://openrefine.org">OpenRefine</Link>. Add this service URL:
          </p>
          <pre>
            <code>{siteUrl}/api/reconcile</code>
          </pre>
          <p>
            Queries can be limited to the <code>Person</code> or <code>Organization</code> type, and
            a <code>birth_year</code> property helps tell people with the same name apart.
          </p>

          <h3>Other authorities</h3>
          <p>
            Records link to the same person in the Library of Congress Name Authority File, VIAF,
            Wikidata, ORCID, ISNI, and SNAC where those exist. Organizations link to ROR and
            Wikidata.
          </p>

          <h3>Editorial policy</h3>
          <p>
            What we include, what counts as evidence, and how to request a correction or removal are
            described in the <Link href="/about/editorial-policy">editorial policy</Link>. Technical
            details are in{" "}
            <Link href={`${REPO_URL}/blob/main/docs/authority.md`}>docs/authority.md</Link>.
          </p>

          <h3>Photos</h3>
          <p>
            The data is CC0, but profile photos come from many places (Wikimedia Commons, press
            kits, and photos shared by the people themselves) and keep their original terms. Credits
            appear on each profile where we know them. If you took a photo and want it credited or
            removed, <Link href={`${REPO_URL}/issues/new/choose`}>let us know</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
