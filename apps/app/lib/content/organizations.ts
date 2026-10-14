import rawOrganizations from "./organizations.generated.json";
import { getAllProfiles } from "./profiles";
import type { Organization, OrganizationRef, Profile } from "./types";

// `organizations.generated.json` is produced by scripts/generate-content.mjs
// and is already sorted by name.
// SAFETY: written by scripts/generate-content.mjs from data/organizations, which
// scripts/validate.js checks against this shape.
const ALL = rawOrganizations as Organization[];
const BY_SLUG = new Map(ALL.map((o) => [o.slug, o]));
const BY_ID = new Map(ALL.map((o) => [o.id, o]));

export const ORGANIZATION_TYPE_LABELS: Record<Organization["type"], string> = {
  association: "Association",
  other: "Organization",
  publisher: "Publisher",
  "research-center": "Research Center",
  school: "School",
  "training-center": "Training Center",
  university: "University",
};

export const getAllOrganizations = (): Organization[] => ALL;

export const getOrganizationBySlug = (slug: string): Organization | null =>
  BY_SLUG.get(slug) ?? null;

export const getOrganizationById = (id: string): Organization | null => BY_ID.get(id) ?? null;

export interface OrganizationMember {
  profile: Profile;
  relation: "attended" | "affiliated";
  ref: OrganizationRef;
}

/** Everyone who attended or is affiliated with an organization. */
export const getOrganizationMembers = (slug: string): OrganizationMember[] => {
  const members: OrganizationMember[] = [];
  for (const profile of getAllProfiles()) {
    for (const ref of profile.schools) {
      if (ref.organization === slug) {
        members.push({ profile, ref, relation: "attended" });
      }
    }
    for (const ref of profile.affiliations) {
      if (ref.organization === slug) {
        members.push({ profile, ref, relation: "affiliated" });
      }
    }
  }
  return members;
};

/** Organizations that contributors are affiliated with, with how many people each. */
export const getAffiliationOptions = (): { slug: string; name: string; count: number }[] => {
  const counts = new Map<string, number>();
  for (const profile of getAllProfiles("contributor")) {
    for (const slug of new Set(profile.affiliations.map((a) => a.organization))) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([slug, count]) => ({ count, name: BY_SLUG.get(slug)?.name ?? slug, slug }))
    .toSorted((a, b) => b.count - a.count || a.name.localeCompare(b.name));
};
