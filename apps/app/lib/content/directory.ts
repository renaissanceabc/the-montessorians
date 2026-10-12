import type { DirectoryCounts } from "@/components/directory-shell";
import { getAllOrganizations } from "./organizations";
import { getAllProfiles } from "./profiles";

/** Counts for the directory tabs. Someone who is both counts in both collections. */
export function getDirectoryCounts(): DirectoryCounts {
  return {
    all: getAllProfiles().length,
    alumni: getAllProfiles("alum").length,
    contributors: getAllProfiles("contributor").length,
    organizations: getAllOrganizations().length,
  };
}
