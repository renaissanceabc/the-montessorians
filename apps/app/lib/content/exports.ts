import { identifierEntries, idUrl, organizationJsonLd, personJsonLd } from "./authority";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles } from "./profiles";
import type { Profile } from "./types";

// Bulk exports of the dataset, served from /data/*.

const LICENSE = "https://creativecommons.org/publicdomain/zero/1.0/";

/** A plain-JSON person record: the YAML fields plus the permanent URI. */
export function personRecord(profile: Profile) {
  return {
    uri: idUrl(profile.id),
    ...profile,
    tags: profile.tags.map((t) => t.slug),
  };
}

export function peopleJson() {
  return {
    license: LICENSE,
    generatedAt: new Date().toISOString(),
    people: getAllProfiles().map(personRecord),
  };
}

export function peopleJsonLd() {
  return {
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
  };
}

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

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function peopleCsv(siteUrl: string): string {
  const rows = getAllProfiles().map((p) => {
    const ids = Object.fromEntries(
      identifierEntries(p.identifiers).map((e) => [e.scheme, e.value])
    );
    const row: Record<(typeof CSV_COLUMNS)[number], unknown> = {
      id: p.id,
      uri: idUrl(p.id),
      name: p.name,
      name_authorized: p.nameAuthorized,
      kind: p.kind,
      roles: p.roles.join("; "),
      birth_year: p.birthYear,
      death_year: p.deathYear,
      tagline: p.tagline,
      tags: p.tags.map((t) => t.slug).join("; "),
      schools: p.schools.map((s) => s.organizationName ?? s.organization).join("; "),
      affiliations: p.affiliations.map((a) => a.organizationName ?? a.organization).join("; "),
      contributions: p.contributions.length,
      verification: p.verification,
      status: p.status,
      lcnaf: ids.lcnaf,
      viaf: ids.viaf,
      wikidata: ids.wikidata,
      orcid: ids.orcid,
      isni: ids.isni,
      snac: ids.snac,
      url: `${siteUrl}/${p.slug}`,
    };
    return CSV_COLUMNS.map((c) => csvCell(row[c])).join(",");
  });
  return `${[CSV_COLUMNS.join(","), ...rows].join("\n")}\n`;
}
