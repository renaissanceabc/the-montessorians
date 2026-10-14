import { identifierEntries, idUrl, organizationJsonLd, personJsonLd } from "./authority";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles } from "./profiles";
import type { Profile } from "./types";

// Bulk exports of the dataset, served from /data/*.

const LICENSE = "https://creativecommons.org/publicdomain/zero/1.0/";

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

export const peopleJsonLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    ...getAllProfiles().map((p) => {
      const { "@context": _, ...node } = personJsonLd(p);
      return node;
    }),
    ...getAllOrganizations().map((o) => {
      const { "@context": _, ...node } = organizationJsonLd(o);
      return node;
    }),
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
