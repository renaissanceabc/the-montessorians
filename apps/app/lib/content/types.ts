// Shared content types for the file-based (build-time) data layer.
// These replace the tRPC/DB-inferred shapes that used to live in trpc/types.ts.

export const EDUCATION_TYPES = ["montessori", "homeschool", "other"] as const;
export const LINK_TYPES = [
  "wikipedia",
  "website",
  "linkedin",
  "x",
  "tiktok",
  "instagram",
  "article",
  "youtube",
  "imdb",
] as const;
export const PROFILE_KINDS = ["alum", "contributor"] as const;
export const CONTRIBUTOR_ROLES = [
  "founder",
  "trainer",
  "practitioner",
  "teacher-scholar",
  "researcher",
  "author",
  "philosopher",
] as const;
export const CONTRIBUTOR_ROLE_LABELS: Record<(typeof CONTRIBUTOR_ROLES)[number], string> = {
  author: "Author",
  founder: "Founder",
  philosopher: "Philosopher",
  practitioner: "Practitioner",
  researcher: "Researcher",
  "teacher-scholar": "Teacher-scholar",
  trainer: "Trainer",
};
export const SOURCE_TYPES = [
  "wikipedia",
  "article",
  "social",
  "publication",
  "authority",
  "personal-knowledge",
  "other",
] as const;
export const CONTRIBUTION_TYPES = [
  "book",
  "article",
  "chapter",
  "lecture",
  "training-program",
  "media",
  "other",
] as const;
export const ORGANIZATION_TYPES = [
  "school",
  "training-center",
  "university",
  "association",
  "research-center",
  "publisher",
  "other",
] as const;

export type EducationType = (typeof EDUCATION_TYPES)[number];
export type LinkType = (typeof LINK_TYPES)[number];
export type ProfileKind = (typeof PROFILE_KINDS)[number];
export type ContributorRole = (typeof CONTRIBUTOR_ROLES)[number];
export type SourceType = (typeof SOURCE_TYPES)[number];
export type ContributionType = (typeof CONTRIBUTION_TYPES)[number];
export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];
export type Verification = "verified" | "reported" | "confirmed" | "unverified";
export type RecordStatus = "provisional" | "reviewed";

export interface ProfileLink {
  url: string;
  type: LinkType;
}

export interface ProfileTag {
  slug: string;
  label: string;
}

export interface Source {
  type: SourceType;
  url?: string;
  note?: string;
}

export interface Contribution {
  title: string;
  /** All authors in publication order, including the profile's own person */
  authors?: string[];
  type: ContributionType;
  year?: number;
  venue?: string;
  doi?: string;
  isbn?: string;
  url?: string;
}

export interface OrganizationRef {
  organization: string;
  /** Resolved at build time by scripts/generate-content.mjs */
  organizationName?: string;
  organizationShortName?: string;
  organizationLogoUrl?: string;
  role?: string;
  level?: string;
  from?: number;
  to?: number;
}

export interface PersonIdentifiers {
  lcnaf?: string;
  viaf?: string;
  wikidata?: string;
  orcid?: string;
  isni?: string;
  snac?: string;
}

export interface GlossaryCitation {
  label: string;
  url: string;
}

export const RELATIONS = [
  "parent",
  "child",
  "sibling",
  "spouse",
  "trained_by",
  "trained",
  "advisor",
  "advisee",
  "colleague",
] as const;
export type Relation = (typeof RELATIONS)[number] | "coauthor";

/** As recorded in YAML: how `person` relates to the record's own person. */
export interface RawRelated {
  person: string;
  relation: (typeof RELATIONS)[number];
  source?: string;
  note?: string;
}

/** Resolved for display: both sides of every relationship, plus derived co-authors. */
export interface RelatedPerson {
  slug: string;
  name: string;
  imageUrl: string | null;
  relation: Relation;
  /** Shared contributions, for co-authors */
  count?: number;
  source?: string;
}

/** Shape of a single record in `profiles.generated.json` (tags are raw slugs). */
export interface RawProfile {
  id: string;
  slug: string;
  name: string;
  kind?: ProfileKind | ProfileKind[];
  roles?: ContributorRole[];
  pinned?: boolean;
  nameAuthorized?: string;
  nameVariants?: string[];
  birthYear?: number;
  deathYear?: number;
  tagline?: string;
  bio?: string;
  tags?: string[];
  education?: EducationType[];
  educationNotes?: string;
  schools?: OrganizationRef[];
  montessoriNotes?: string;
  affiliations?: OrganizationRef[];
  contributions?: Contribution[];
  notableAchievements?: string[];
  quotes?: string[];
  sources?: Source[];
  verification?: Verification;
  status?: RecordStatus;
  identifiers?: PersonIdentifiers;
  glossaryCitations?: GlossaryCitation[];
  related?: RawRelated[];
  imageCredit?: string;
  links?: ProfileLink[];
  imageUrl: string | null;
  addedAt: string;
}

/** Enriched profile used throughout the UI (tags resolved to {slug,label}). */
export interface Profile {
  id: string;
  slug: string;
  name: string;
  /** Primary collection: contributor if the person is one, otherwise alum */
  kind: ProfileKind;
  /** Every collection the person belongs to (someone can be both) */
  kinds: ProfileKind[];
  roles: ContributorRole[];
  pinned: boolean;
  nameAuthorized: string | null;
  nameVariants: string[];
  birthYear: number | null;
  deathYear: number | null;
  tagline: string | null;
  bio: string | null;
  education: EducationType[];
  educationNotes: string | null;
  schools: OrganizationRef[];
  montessoriNotes: string | null;
  affiliations: OrganizationRef[];
  contributions: Contribution[];
  notableAchievements: string[];
  quotes: string[];
  sources: Source[];
  verification: Verification | null;
  status: RecordStatus;
  identifiers: PersonIdentifiers;
  glossaryCitations: GlossaryCitation[];
  related: RawRelated[];
  imageCredit: string | null;
  imageUrl: string | null;
  tags: ProfileTag[];
  links: ProfileLink[];
  addedAt: string;
}

export interface Organization {
  id: string;
  slug: string;
  name: string;
  shortName?: string;
  type: OrganizationType;
  nameVariants?: string[];
  description?: string;
  location?: string;
  founded?: number;
  website?: string;
  logoSource?: string;
  /** Resolved at build time from images/organizations/ */
  logoUrl?: string | null;
  parent?: string;
  identifiers?: {
    lcnaf?: string;
    viaf?: string;
    wikidata?: string;
    ror?: string;
    isni?: string;
  };
}

export interface AuthorityChange {
  id: string;
  action: "merged" | "withdrawn" | "renamed";
  slug: string;
  name?: string;
  replacedBy?: string;
  date: string;
  reason?: string;
}

export type PastProfile = Profile & { featuredDate: string };

export type AdjacentRef =
  | { slug: string; name: string; imageUrl: string | null }
  | { slug: null; name: null; imageUrl: null };

export interface ProfilePage {
  profile: Profile;
  previous: AdjacentRef;
  next: AdjacentRef;
}

export type Tag = ProfileTag;
export type TagWithCount = ProfileTag & { profileCount: number };
