import { siteUrl } from "@/lib/utils";
import rawChanges from "./changes.generated.json";
import { getOrganizationById, getOrganizationBySlug } from "./organizations";
import { getProfileById } from "./profiles";
import type { AuthorityChange, Organization, Profile } from "./types";

// Everything that turns a record into a citable authority entry: permanent
// ids, the merge/withdrawal log, external identifier URIs, and JSON-LD.

const CHANGES = rawChanges as AuthorityChange[];

export function getChanges(): AuthorityChange[] {
  return CHANGES;
}

export function getChangeForId(id: string): AuthorityChange | null {
  return CHANGES.find((c) => c.id === id && c.action !== "renamed") ?? null;
}

/** Permanent URI for a record. */
export const idUrl = (id: string) => `${siteUrl}/id/${id}`;

export type ResolvedId =
  | { kind: "person"; profile: Profile }
  | { kind: "organization"; organization: Organization }
  | { kind: "merged"; change: AuthorityChange; target: ResolvedId | null }
  | { kind: "withdrawn"; change: AuthorityChange };

/** Resolve a permanent id to its live record, following merges. */
export function resolveId(id: string, depth = 0): ResolvedId | null {
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
    return { kind: "merged", change, target: resolveId(change.replacedBy, depth + 1) };
  }
  if (change?.action === "withdrawn") {
    return { kind: "withdrawn", change };
  }
  return null;
}

/** The page URL path for a resolved id. */
export function pathForResolved(resolved: ResolvedId | null): string | null {
  if (!resolved) {
    return null;
  }
  switch (resolved.kind) {
    case "person":
      return `/${resolved.profile.slug}`;
    case "organization":
      return `/organizations/${resolved.organization.slug}`;
    case "merged":
      return pathForResolved(resolved.target);
    default:
      return null;
  }
}

export const IDENTIFIER_LABELS = {
  lcnaf: "Library of Congress",
  viaf: "VIAF",
  wikidata: "Wikidata",
  orcid: "ORCID",
  isni: "ISNI",
  snac: "SNAC",
  ror: "ROR",
} as const;

export type IdentifierScheme = keyof typeof IDENTIFIER_LABELS;

export function identifierUrl(scheme: IdentifierScheme, value: string): string {
  switch (scheme) {
    case "lcnaf":
      return `http://id.loc.gov/authorities/names/${value}`;
    case "viaf":
      return `https://viaf.org/viaf/${value}`;
    case "wikidata":
      return `http://www.wikidata.org/entity/${value}`;
    case "orcid":
      return `https://orcid.org/${value}`;
    case "isni":
      return `https://isni.org/isni/${value}`;
    case "snac":
      return `https://snaccooperative.org/ark:/99166/${value}`;
    case "ror":
      return `https://ror.org/${value}`;
    default:
      return value;
  }
}

export function identifierEntries(
  identifiers: Partial<Record<IdentifierScheme, string>> | undefined
): { scheme: IdentifierScheme; label: string; value: string; url: string }[] {
  return (Object.entries(identifiers ?? {}) as [IdentifierScheme, string][])
    .filter(([, value]) => Boolean(value))
    .map(([scheme, value]) => ({
      scheme,
      label: IDENTIFIER_LABELS[scheme],
      value,
      url: identifierUrl(scheme, value),
    }));
}

export function contributionUrl(c: Profile["contributions"][number]): string | null {
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
}

const SCHEMA_CONTRIBUTION_TYPES: Record<string, string> = {
  book: "Book",
  article: "ScholarlyArticle",
  chapter: "Chapter",
  lecture: "Event",
  "training-program": "Course",
  media: "CreativeWork",
  other: "CreativeWork",
};

/** schema.org JSON-LD for an organization. */
export function organizationJsonLd(org: Organization) {
  return {
    "@context": "https://schema.org",
    "@type":
      org.type === "school" || org.type === "university"
        ? "EducationalOrganization"
        : "Organization",
    "@id": idUrl(org.id),
    identifier: org.id,
    name: org.name,
    alternateName: org.nameVariants,
    description: org.description,
    url: `${siteUrl}/organizations/${org.slug}`,
    sameAs: [
      ...identifierEntries(org.identifiers).map((e) => e.url),
      ...(org.website ? [org.website] : []),
    ],
    foundingDate: org.founded ? String(org.founded) : undefined,
    location: org.location,
    parentOrganization: org.parent
      ? { "@id": idUrl(getOrganizationBySlug(org.parent)?.id ?? org.parent) }
      : undefined,
  };
}

/** schema.org JSON-LD for a person, linked to other authority files. */
export function personJsonLd(profile: Profile) {
  const orgNode = (slug: string) => {
    const org = getOrganizationBySlug(slug);
    return org ? { "@id": idUrl(org.id), name: org.name } : { name: slug };
  };
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": idUrl(profile.id),
    identifier: profile.id,
    name: profile.name,
    alternateName: [profile.nameAuthorized, ...profile.nameVariants].filter(Boolean),
    description: profile.tagline || profile.bio || undefined,
    url: `${siteUrl}/${profile.slug}`,
    image: profile.imageUrl ? `${siteUrl}/api/og/${profile.slug}.png` : undefined,
    birthDate: profile.birthYear ? String(profile.birthYear) : undefined,
    deathDate: profile.deathYear ? String(profile.deathYear) : undefined,
    jobTitle: profile.roles.length > 0 ? profile.roles : undefined,
    sameAs: [
      ...identifierEntries(profile.identifiers).map((e) => e.url),
      ...profile.links.map((l) => l.url),
    ],
    alumniOf:
      profile.schools.length > 0 ? profile.schools.map((s) => orgNode(s.organization)) : undefined,
    affiliation:
      profile.affiliations.length > 0
        ? profile.affiliations.map((a) => orgNode(a.organization))
        : undefined,
    subjectOf:
      profile.contributions.length > 0
        ? profile.contributions.map((c) => ({
            "@type": SCHEMA_CONTRIBUTION_TYPES[c.type] ?? "CreativeWork",
            name: c.title,
            datePublished: c.year ? String(c.year) : undefined,
            publisher: c.venue,
            url: contributionUrl(c) ?? undefined,
            isbn: c.isbn,
          }))
        : undefined,
    dateModified: profile.addedAt,
  };
}
