import { siteUrl as origin } from "@/lib/utils";

import {
  DATASET_ID,
  identifierEntries,
  idUrl,
  LICENSE_URL,
  organizationJsonLd,
  personJsonLd,
} from "./authority";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles } from "./profiles";
import type { Profile } from "./types";

// Bulk exports of the dataset, served from /data/*.

const LICENSE = LICENSE_URL;

export const DOWNLOADS = [
  {
    format: "application/json",
    href: "/data/people.json",
    label: "People (JSON)",
    note: "Every field, plus each record's permanent URI",
  },
  {
    format: "application/ld+json",
    href: "/data/people.jsonld",
    label: "People and organizations (JSON-LD)",
    note: "schema.org, with sameAs links to other authorities",
  },
  {
    format: "text/csv",
    href: "/data/people.csv",
    label: "People (CSV)",
    note: "One row per person, for spreadsheets and OpenRefine",
  },
  {
    format: "application/json",
    href: "/data/organizations.json",
    label: "Organizations (JSON)",
    note: "Schools, training centers, universities, associations",
  },
  {
    format: "application/json",
    href: "/data/changes.json",
    label: "Changes (JSON)",
    note: "Merged, withdrawn, and renamed records",
  },
] as const;

/** schema.org Dataset describing the whole authority file, for /data and data catalogs. */
export const datasetJsonLd = () => ({
  "@context": "https://schema.org",
  "@id": DATASET_ID,
  "@type": "Dataset",
  creator: { "@type": "Organization", name: "Renaissance", url: "https://renaissance.education" },
  description:
    "An open name authority for Montessori alumni and contributors to the Montessori field, with permanent identifiers and links to LCNAF, VIAF, Wikidata, ORCID, ISNI, SNAC, and ROR.",
  distribution: DOWNLOADS.map((d) => ({
    "@type": "DataDownload",
    contentUrl: `${origin}${d.href}`,
    encodingFormat: d.format,
    name: d.label,
  })),
  isAccessibleForFree: true,
  keywords: ["Montessori", "education", "name authority", "linked open data"],
  license: LICENSE_URL,
  name: "The Montessorians",
  url: `${origin}/data`,
});

/** A plain-JSON person record: the YAML fields plus the permanent URI. */
export const personRecord = (profile: Profile) => ({
  uri: idUrl(profile.id),
  ...profile,
  tags: profile.tags.map((t) => t.slug),
});

export const peopleJson = () => ({
  generatedAt: new Date().toISOString(),
  license: LICENSE,
  people: getAllProfiles().map(personRecord),
});

/** A node for a shared `@graph`, which carries the context once. */
const withoutContext = <T extends { "@context": unknown }>(full: T) => {
  const { "@context": _, ...node } = full;
  return node;
};

export const peopleJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    withoutContext(datasetJsonLd()),
    ...getAllProfiles().map((p) => withoutContext(personJsonLd(p))),
    ...getAllOrganizations().map((o) => withoutContext(organizationJsonLd(o))),
  ],
});

const CSV_COLUMNS = [
  "id",
  "uri",
  "name",
  "name_authorized",
  "kind",
  "roles",
  "birth_year",
  "death_year",
  "tagline",
  "tags",
  "schools",
  "affiliations",
  "contributions",
  "verification",
  "status",
  "lcnaf",
  "viaf",
  "wikidata",
  "orcid",
  "isni",
  "snac",
  "url",
] as const;

/** A CSV cell before quoting: missing values become empty cells. */
type CsvValue = string | number | boolean | null | undefined;

const csvCell = (value: CsvValue) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const peopleCsv = (siteUrl: string): string => {
  const rows = getAllProfiles().map((p) => {
    const ids = Object.fromEntries(
      identifierEntries(p.identifiers).map((e) => [e.scheme, e.value])
    );
    const row: Record<(typeof CSV_COLUMNS)[number], CsvValue> = {
      affiliations: p.affiliations.map((a) => a.organizationName ?? a.organization).join("; "),
      birth_year: p.birthYear,
      contributions: p.contributions.length,
      death_year: p.deathYear,
      id: p.id,
      isni: ids.isni,
      kind: p.kind,
      lcnaf: ids.lcnaf,
      name: p.name,
      name_authorized: p.nameAuthorized,
      orcid: ids.orcid,
      roles: p.roles.join("; "),
      schools: p.schools.map((s) => s.organizationName ?? s.organization).join("; "),
      snac: ids.snac,
      status: p.status,
      tagline: p.tagline,
      tags: p.tags.map((t) => t.slug).join("; "),
      uri: idUrl(p.id),
      url: `${siteUrl}/${p.slug}`,
      verification: p.verification,
      viaf: ids.viaf,
      wikidata: ids.wikidata,
    };
    return CSV_COLUMNS.map((c) => csvCell(row[c])).join(",");
  });
  return `${[CSV_COLUMNS.join(","), ...rows].join("\n")}\n`;
};
