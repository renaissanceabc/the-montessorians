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
  "teacher-scholar",
  "researcher",
  "author",
  "philosopher",
] as const;
export const CONTRIBUTOR_ROLE_LABELS: Record<(typeof CONTRIBUTOR_ROLES)[number], string> = {
  founder: "Founder",
  trainer: "Trainer",
  "teacher-scholar": "Teacher-scholar",
  researcher: "Researcher",
  author: "Author",
  philosopher: "Philosopher",
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
export type Verification = "verified" | "reported" | "confirmed";
export type RecordStatus = "provisional" | "reviewed";

export type ProfileLink = {
  url: string;
  type: LinkType;
};

export type ProfileTag = {
  slug: string;
  label: string;
};

export type Source = {
  type: SourceType;
  url?: string;
  note?: string;
};

export type Contribution = {
  title: string;
  type: ContributionType;
  year?: number;
  venue?: string;
  doi?: string;
  isbn?: string;
  url?: string;
};

export type OrganizationRef = {
  organization: string;
  /** Resolved at build time by scripts/generate-content.mjs */
  organizationName?: string;
  role?: string;
  level?: string;
  from?: number;
  to?: number;
};

export type PersonIdentifiers = {
  lcnaf?: string;
  viaf?: string;
  wikidata?: string;
  orcid?: string;
  isni?: string;
  snac?: string;
};

export type GlossaryCitation = { label: string; url: string };

/** Shape of a single record in `profiles.generated.json` (tags are raw slugs). */
export type RawProfile = {
  id: string;
  slug: string;
  name: string;
  kind?: ProfileKind;
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
  imageCredit?: string;
  links?: ProfileLink[];
  imageUrl: string | null;
  addedAt: string;
};

/** Enriched profile used throughout the UI (tags resolved to {slug,label}). */
export type Profile = {
  id: string;
  slug: string;
  name: string;
  kind: ProfileKind;
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
  imageCredit: string | null;
  imageUrl: string | null;
  tags: ProfileTag[];
  links: ProfileLink[];
  addedAt: string;
};

export type Organization = {
  id: string;
  slug: string;
  name: string;
  type: OrganizationType;
  nameVariants?: string[];
  description?: string;
  location?: string;
  founded?: number;
  website?: string;
  parent?: string;
  identifiers?: {
    lcnaf?: string;
    viaf?: string;
    wikidata?: string;
    ror?: string;
    isni?: string;
  };
};

export type AuthorityChange = {
  id: string;
  action: "merged" | "withdrawn" | "renamed";
  slug: string;
  name?: string;
  replacedBy?: string;
  date: string;
  reason?: string;
};

export type PastProfile = Profile & { featuredDate: string };

export type AdjacentRef = { slug: string; name: string } | { slug: null; name: null };

export type ProfilePage = {
  profile: Profile;
  previous: AdjacentRef;
  next: AdjacentRef;
};

export type Tag = ProfileTag;
export type TagWithCount = ProfileTag & { profileCount: number };
