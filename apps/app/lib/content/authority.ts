import { siteUrl } from "@/lib/utils";

import rawChanges from "./changes.generated.json";
import { getOrganizationById, getOrganizationBySlug } from "./organizations";
import { getProfileById } from "./profiles";
import { CONTRIBUTOR_ROLE_LABELS } from "./types";
import type {
  AuthorityChange,
  Contribution,
  ContributionType,
  Organization,
  Profile,
  ProfileLink,
} from "./types";

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

/** `undefined` for an empty list, so JSON-LD omits the property instead of emitting `[]`. */
const nonEmpty = <T>(list: T[]): T[] | undefined => (list.length > 0 ? list : undefined);

const absoluteUrl = (pathOrUrl: string) =>
  pathOrUrl.startsWith("http") ? pathOrUrl : `${siteUrl}${pathOrUrl}`;

const SCHEMA_ORGANIZATION_TYPES = {
  association: "Organization",
  other: "Organization",
  publisher: "Organization",
  "research-center": "ResearchOrganization",
  school: "EducationalOrganization",
  "training-center": "EducationalOrganization",
  university: "CollegeOrUniversity",
} satisfies Record<Organization["type"], string>;

// Lectures have no schema.org type with an author (Event has performers), so
// they stay generic creative works.
const SCHEMA_CONTRIBUTION_TYPES = {
  article: "ScholarlyArticle",
  book: "Book",
  chapter: "Chapter",
  lecture: "CreativeWork",
  media: "CreativeWork",
  other: "CreativeWork",
  "training-program": "Course",
} satisfies Record<ContributionType, string>;

/** Link types that identify the person (sameAs); the rest are pages about them. */
const IDENTITY_LINK_TYPES = new Set<ProfileLink["type"]>([
  "wikipedia",
  "website",
  "linkedin",
  "x",
  "tiktok",
  "instagram",
  "youtube",
  "imdb",
]);

/** A reference to an organization record, typed so it stands alone. */
const organizationRefNode = (slug: string) => {
  const org = getOrganizationBySlug(slug);
  return org
    ? { "@id": idUrl(org.id), "@type": SCHEMA_ORGANIZATION_TYPES[org.type], name: org.name }
    : { "@type": "Organization", name: slug };
};

/** Where a contribution appeared: the journal, the book, or the publisher. */
const venueNode = (c: Contribution) => {
  if (!c.venue) {
    return {};
  }
  if (c.type === "article") {
    return { isPartOf: { "@type": "Periodical", name: c.venue } };
  }
  if (c.type === "chapter") {
    return { isPartOf: { "@type": "Book", name: c.venue } };
  }
  return { publisher: { "@type": "Organization", name: c.venue } };
};

const contributionNode = (c: Contribution) => ({
  ...venueNode(c),
  "@type": SCHEMA_CONTRIBUTION_TYPES[c.type] ?? "CreativeWork",
  datePublished: c.year ? String(c.year) : undefined,
  identifier: c.doi ? { "@type": "PropertyValue", propertyID: "DOI", value: c.doi } : undefined,
  isbn: c.isbn,
  name: c.title,
  url: contributionUrl(c) ?? undefined,
});

/** schema.org JSON-LD for an organization. */
export const organizationJsonLd = (org: Organization) => {
  const url = `${siteUrl}/organizations/${org.slug}`;
  return {
    "@context": "https://schema.org",
    "@id": idUrl(org.id),
    "@type": SCHEMA_ORGANIZATION_TYPES[org.type],
    alternateName: nonEmpty(
      [org.shortName, ...(org.nameVariants ?? [])].filter((n): n is string => Boolean(n))
    ),
    description: org.description,
    foundingDate: org.founded ? String(org.founded) : undefined,
    identifier: org.id,
    location: org.location,
    logo: org.logoUrl ? absoluteUrl(org.logoUrl) : undefined,
    mainEntityOfPage: url,
    name: org.name,
    parentOrganization: org.parent ? organizationRefNode(org.parent) : undefined,
    sameAs: nonEmpty([
      ...identifierEntries(org.identifiers).map((e) => e.url),
      ...(org.website ? [org.website] : []),
    ]),
    url,
  };
};

/** schema.org JSON-LD for a person, linked to other authority files. */
export const personJsonLd = (profile: Profile) => {
  const url = `${siteUrl}/${profile.slug}`;
  const aboutPages = profile.links.filter((l) => !IDENTITY_LINK_TYPES.has(l.type));
  return {
    "@context": "https://schema.org",
    "@id": idUrl(profile.id),
    // Their own works: the person is each work's author.
    "@reverse":
      profile.contributions.length > 0
        ? { author: profile.contributions.map(contributionNode) }
        : undefined,
    "@type": "Person",
    affiliation: nonEmpty(profile.affiliations.map((a) => organizationRefNode(a.organization))),
    alternateName: nonEmpty(
      [...new Set([profile.nameAuthorized, ...profile.nameVariants])].filter(
        (n): n is string => Boolean(n) && n !== profile.name
      )
    ),
    alumniOf: nonEmpty(profile.schools.map((s) => organizationRefNode(s.organization))),
    birthDate: profile.birthYear ? String(profile.birthYear) : undefined,
    deathDate: profile.deathYear ? String(profile.deathYear) : undefined,
    description: profile.tagline || profile.bio || undefined,
    identifier: profile.id,
    image: profile.imageUrl ? absoluteUrl(profile.imageUrl) : undefined,
    jobTitle: nonEmpty(profile.roles.map((r) => CONTRIBUTOR_ROLE_LABELS[r])),
    mainEntityOfPage: url,
    name: profile.name,
    sameAs: nonEmpty([
      ...identifierEntries(profile.identifiers).map((e) => e.url),
      ...profile.links.filter((l) => IDENTITY_LINK_TYPES.has(l.type)).map((l) => l.url),
    ]),
    // Articles and pages about them.
    subjectOf: nonEmpty(aboutPages.map((l) => ({ "@type": "CreativeWork", url: l.url }))),
    url,
  };
};
