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

export type EducationType = (typeof EDUCATION_TYPES)[number];
export type LinkType = (typeof LINK_TYPES)[number];

export type ProfileLink = {
  url: string;
  type: LinkType;
};

export type ProfileTag = {
  slug: string;
  label: string;
};

/** Shape of a single record in `profiles.generated.json` (tags are raw slugs). */
export type RawProfile = {
  slug: string;
  name: string;
  tagline?: string;
  bio?: string;
  tags?: string[];
  education?: EducationType[];
  educationNotes?: string;
  notableAchievements?: string[];
  quotes?: string[];
  links?: ProfileLink[];
  imageUrl: string;
  addedAt: string;
};

/** Enriched profile used throughout the UI (tags resolved to {slug,label}). */
export type Profile = {
  slug: string;
  name: string;
  tagline: string | null;
  bio: string | null;
  education: EducationType[];
  educationNotes: string | null;
  notableAchievements: string[];
  quotes: string[];
  imageUrl: string | null;
  tags: ProfileTag[];
  links: ProfileLink[];
  addedAt: string;
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
