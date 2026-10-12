import { siteUrl } from "@/lib/utils";

import rawChanges from "./changes.generated.json";
import { getOrganizationById, getOrganizationBySlug } from "./organizations";
import { getProfileById } from "./profiles";
import type { AuthorityChange, ContributionType, Organization, Profile } from "./types";

// Everything that turns a record into a citable authority entry: permanent
// ids, the merge/withdrawal log, external identifier URIs, and JSON-LD.

// SAFETY: changes.generated.json is written by scripts/generate-content.mjs from
// data/authority/changes.yaml, which scripts/validate.js checks against this shape.
const CHANGES = rawChanges as AuthorityChange[];

export const getChanges = (): AuthorityChange[] => CHANGES;

export const getChangeForId = (id: string): AuthorityChange | null =>
  CHANGES.find((c) => c.id === id && c.action !== "renamed") ?? null;

/** Permanent URI for a record. */
export const idUrl = (id: string) => `${siteUrl}/id/${id}`;

export type ResolvedId =
  | { kind: "person"; profile: Profile }
  | { kind: "organization"; organization: Organization }
  | { kind: "merged"; change: AuthorityChange; target: ResolvedId | null }
  | { kind: "withdrawn"; change: AuthorityChange };

/** Resolve a permanent id to its live record, following merges. */
export const resolveId = (id: string, depth = 0): ResolvedId | null => {
  const profile = getProfileById(id);
  if (profile) {
    return { kind: "person", profile };
  }
  const organization = getOrganizationById(id);
  if (organization) {
    return { kind: "organization", organization };
  }
  const change = getChangeForId(id);
  if (change?.action === "merged" && change.replacedBy && depth < 5) {
    return { change, kind: "merged", target: resolveId(change.replacedBy, depth + 1) };
  }
  if (change?.action === "withdrawn") {
    return { change, kind: "withdrawn" };
  }
  return null;
};

/** The page URL path for a resolved id. */
export const pathForResolved = (resolved: ResolvedId | null): string | null => {
  if (!resolved) {
    return null;
  }
  switch (resolved.kind) {
    case "person": {
      return `/${resolved.profile.slug}`;
    }
    case "organization": {
      return `/organizations/${resolved.organization.slug}`;
    }
    case "merged": {
      return pathForResolved(resolved.target);
    }
    default: {
      return null;
    }
  }
};

export const IDENTIFIER_LABELS = {
  isni: "ISNI",
  lcnaf: "Library of Congress",
  orcid: "ORCID",
  ror: "ROR",
  snac: "SNAC",
  viaf: "VIAF",
  wikidata: "Wikidata",
} as const;

export type IdentifierScheme = keyof typeof IDENTIFIER_LABELS;

export const identifierUrl = (scheme: IdentifierScheme, value: string): string => {
  switch (scheme) {
    case "lcnaf": {
      return `http://id.loc.gov/authorities/names/${value}`;
    }
    case "viaf": {
      return `https://viaf.org/viaf/${value}`;
    }
    case "wikidata": {
      return `http://www.wikidata.org/entity/${value}`;
    }
    case "orcid": {
      return `https://orcid.org/${value}`;
    }
    case "isni": {
      return `https://isni.org/isni/${value}`;
    }
    case "snac": {
      return `https://snaccooperative.org/ark:/99166/${value}`;
    }
    case "ror": {
      return `https://ror.org/${value}`;
    }
    default: {
      return value;
    }
  }
};

export const identifierEntries = (
  identifiers: Partial<Record<IdentifierScheme, string>> | undefined
): { scheme: IdentifierScheme; label: string; value: string; url: string }[] =>
  // SAFETY: the keys of an identifiers map are IdentifierSchemes by its type, and
  // the generated dataset only contains schemes validate.js accepts.
  (Object.entries(identifiers ?? {}) as [IdentifierScheme, string][])
    .filter(([, value]) => Boolean(value))
    .map(([scheme, value]) => ({
      label: IDENTIFIER_LABELS[scheme],
      scheme,
      url: identifierUrl(scheme, value),
      value,
    }));

export const contributionUrl = (c: Profile["contributions"][number]): string | null => {
  if (c.doi) {
    return `https://doi.org/${c.doi}`;
  }
  if (c.url) {
    return c.url;
  }
  if (c.isbn) {
    return `https://openlibrary.org/isbn/${c.isbn}`;
  }
  return null;
};

const SCHEMA_CONTRIBUTION_TYPES = {
  article: "ScholarlyArticle",
  book: "Book",
  chapter: "Chapter",
  lecture: "Event",
  media: "CreativeWork",
  other: "CreativeWork",
  "training-program": "Course",
} satisfies Record<ContributionType, string>;

/** schema.org JSON-LD for an organization. */
export const organizationJsonLd = (org: Organization) => ({
  "@context": "https://schema.org",
  "@id": idUrl(org.id),
  "@type":
    org.type === "school" || org.type === "university" ? "EducationalOrganization" : "Organization",
  alternateName: org.nameVariants,
  description: org.description,
  foundingDate: org.founded ? String(org.founded) : undefined,
  identifier: org.id,
  location: org.location,
  name: org.name,
  parentOrganization: org.parent
    ? { "@id": idUrl(getOrganizationBySlug(org.parent)?.id ?? org.parent) }
    : undefined,
  sameAs: [
    ...identifierEntries(org.identifiers).map((e) => e.url),
    ...(org.website ? [org.website] : []),
  ],
  url: `${siteUrl}/organizations/${org.slug}`,
});

/** schema.org JSON-LD for a person, linked to other authority files. */
export const personJsonLd = (profile: Profile) => {
  const orgNode = (slug: string) => {
    const org = getOrganizationBySlug(slug);
    return org ? { "@id": idUrl(org.id), name: org.name } : { name: slug };
  };
  return {
    "@context": "https://schema.org",
    "@id": idUrl(profile.id),
    "@type": "Person",
    affiliation:
      profile.affiliations.length > 0
        ? profile.affiliations.map((a) => orgNode(a.organization))
        : undefined,
    alternateName: [profile.nameAuthorized, ...profile.nameVariants].filter(Boolean),
    alumniOf:
      profile.schools.length > 0 ? profile.schools.map((s) => orgNode(s.organization)) : undefined,
    birthDate: profile.birthYear ? String(profile.birthYear) : undefined,
    dateModified: profile.addedAt,
    deathDate: profile.deathYear ? String(profile.deathYear) : undefined,
    description: profile.tagline || profile.bio || undefined,
    identifier: profile.id,
    image: profile.imageUrl ? `${siteUrl}/api/og/${profile.slug}.png` : undefined,
    jobTitle: profile.roles.length > 0 ? profile.roles : undefined,
    name: profile.name,
    sameAs: [
      ...identifierEntries(profile.identifiers).map((e) => e.url),
      ...profile.links.map((l) => l.url),
    ],
    subjectOf:
      profile.contributions.length > 0
        ? profile.contributions.map((c) => ({
            "@type": SCHEMA_CONTRIBUTION_TYPES[c.type] ?? "CreativeWork",
            datePublished: c.year ? String(c.year) : undefined,
            isbn: c.isbn,
            name: c.title,
            publisher: c.venue,
            url: contributionUrl(c) ?? undefined,
          }))
        : undefined,
    url: `${siteUrl}/${profile.slug}`,
  };
};
