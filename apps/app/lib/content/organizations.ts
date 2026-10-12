import rawOrganizations from "./organizations.generated.json";
import { getAllProfiles } from "./profiles";
import type { Organization, OrganizationRef, Profile } from "./types";

// `organizations.generated.json` is produced by scripts/generate-content.mjs
// and is already sorted by name.
const ALL = rawOrganizations as Organization[];
const BY_SLUG = new Map(ALL.map((o) => [o.slug, o]));
const BY_ID = new Map(ALL.map((o) => [o.id, o]));

export const ORGANIZATION_TYPE_LABELS: Record<Organization["type"], string> = {
  school: "School",
  "training-center": "Training Center",
  university: "University",
  association: "Association",
  "research-center": "Research Center",
  publisher: "Publisher",
  other: "Organization",
};

export function getAllOrganizations(): Organization[] {
  return ALL;
}

export function getOrganizationBySlug(slug: string): Organization | null {
  return BY_SLUG.get(slug) ?? null;
}

export function getOrganizationById(id: string): Organization | null {
  return BY_ID.get(id) ?? null;
}

export type OrganizationMember = {
  profile: Profile;
  relation: "attended" | "affiliated";
  ref: OrganizationRef;
};

/** Everyone who attended or is affiliated with an organization. */
export function getOrganizationMembers(slug: string): OrganizationMember[] {
  const members: OrganizationMember[] = [];
  for (const profile of getAllProfiles()) {
    for (const ref of profile.schools) {
      if (ref.organization === slug) {
        members.push({ profile, relation: "attended", ref });
      }
    }
    for (const ref of profile.affiliations) {
      if (ref.organization === slug) {
        members.push({ profile, relation: "affiliated", ref });
      }
    }
  }
  return members;
}

/** Organizations that contributors are affiliated with, with how many people each. */
export function getAffiliationOptions(): { slug: string; name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const profile of getAllProfiles("contributor")) {
    for (const slug of new Set(profile.affiliations.map((a) => a.organization))) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([slug, count]) => ({ slug, name: BY_SLUG.get(slug)?.name ?? slug, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
