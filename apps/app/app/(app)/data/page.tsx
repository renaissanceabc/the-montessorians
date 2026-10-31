import Link from "next/link";

import { Container } from "@/components/container";
import { formatCitation } from "@/lib/citation";
import { datasetJsonLd, DOWNLOADS } from "@/lib/content/exports";
import { getAllOrganizations } from "@/lib/content/organizations";
import { getAllProfiles } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { REPO_URL } from "@/lib/url";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/data`,
    },
    description:
      "Permanent identifiers, bulk downloads, JSON-LD, and a reconciliation API for The Montessorians name authority.",
    title: "Data & API",
  });

const Data = () => {
  const people = getAllProfiles();
  const example = people.find((p) => p.kind === "contributor") ?? people[0];

  return (
    <Container className="flex flex-col gap-8 pt-6 pb-16 lg:pt-8" size="reading">
      <script
        // oxlint-disable-next-line react/no-danger -- JSON-LD must be inline; "<" is escaped.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(datasetJsonLd()).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
      <h1 className="type-title">Data &amp; API</h1>

      <div className="prose prose-stone prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:whitespace-pre-wrap prose-pre:break-all max-w-none">
        <p className="lead">
          The Montessorians is an open name authority for Montessori alumni and contributors:{" "}
          {people.length} people and {getAllOrganizations().length} organizations, dedicated to the
          public domain under{" "}
          <Link href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</Link>.
        </p>

        <h3 className="scroll-mt-28" id="permanent-identifiers">
          Permanent identifiers
        </h3>
        <p>
          Every record has an identifier that never changes and is never reused, even if the
          person&apos;s name or page address changes. Cite records by their URI:
        </p>
        {example && (
          <pre>
            <code>
              {siteUrl}/id/{example.id}
            </code>
          </pre>
        )}
        <p>
          It redirects to the record&apos;s current page. If a record is merged into another, its
          URI redirects to the surviving record; if it is withdrawn, the URI explains why. Person
          ids look like <code>tm0000001</code>; organization ids look like <code>tmo000001</code>.
        </p>
        <p>
          Linked-data clients that ask for <code>application/ld+json</code> get the record&apos;s
          JSON-LD from the same URI instead of its page.
        </p>
        {example && (
          <>
            <h3 className="scroll-mt-28" id="citing">
              Citing a record
            </h3>
            <p>
              Give the authorized form of the name, the identifier, and the permanent URI. The Cite
              button on every profile copies this for you:
            </p>
            <pre>
              <code>
                {formatCitation({
                  heading: example.nameAuthorized ?? example.name,
                  id: example.id,
                  permanentUrl: `${siteUrl}/id/${example.id}`,
                })}
              </code>
            </pre>
          </>
        )}

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
          profile page embeds the same JSON-LD. Versioned releases of the full dataset are published
          from <Link href={`${REPO_URL}/releases`}>GitHub releases</Link>.
        </p>

        <h3 className="scroll-mt-28" id="reconciliation-api">
          Reconciliation API
        </h3>
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
          Queries can be limited to the <code>Person</code> or <code>Organization</code> type, and a{" "}
          <code>birth_year</code> property helps tell people with the same name apart.
        </p>

        <h3>Other authorities</h3>
        <p>
          Records link to the same person in the Library of Congress Name Authority File, VIAF,
          Wikidata, ORCID, ISNI, and SNAC where those exist. Organizations link to ROR and Wikidata.
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
          The data is CC0, but profile photos come from many places (Wikimedia Commons, press kits,
          and photos shared by the people themselves) and keep their original terms. Credits appear
          on each profile where we know them. If you took a photo and want it credited or removed,{" "}
          <Link href={`${REPO_URL}/issues/new/choose`}>let us know</Link>.
        </p>
      </div>
    </Container>
  );
};
export default Data;
