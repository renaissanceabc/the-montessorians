import yaml from "js-yaml";
import { z } from "zod";
import { CONTRIBUTOR_ROLES, LINK_TYPES, SOURCE_TYPES } from "@/lib/content/types";
import { githubIssueUrl } from "@/lib/url";
import { toTitleCase } from "@/lib/utils";

// A "suggest a Montessorian" submission. Shared by the contribute form (client)
// and /api/submit (server), and mirrors profile.schema.json — minus `id`, which
// maintainers assign when they accept the submission.

const optionalText = (max?: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    (max ? z.string().trim().max(max) : z.string().trim()).optional()
  );

const url = z.string().trim().url("Enter a full link, starting with https://");

const organizationRef = z.object({
  /** Existing organization slug; omitted for a new organization */
  organization: z.string().optional(),
  name: z.string().trim().min(2),
  role: optionalText(120),
});

export const submissionSchema = z
  .object({
    kinds: z
      .array(z.enum(["alum", "contributor"]))
      .min(1, "Pick at least one")
      .max(2),
    name: z.string().trim().min(2, "Add their full name").max(120),
    tagline: z
      .string()
      .trim()
      .min(3, "Add a short tagline")
      .max(100, "Keep the tagline under 100 characters")
      .refine((t) => !t.endsWith("."), "Taglines don't end with a period"),
    tags: z.array(z.string().trim().min(1)).min(1, "Add at least one tag").max(8),
    roles: z.array(z.enum(CONTRIBUTOR_ROLES)).optional(),
    schools: z.array(organizationRef).optional(),
    affiliations: z.array(organizationRef).optional(),
    sources: z
      .array(
        z.object({
          type: z.enum(SOURCE_TYPES),
          url: url.optional(),
          note: optionalText(300),
        })
      )
      .min(1, "Tell us how you know"),
    bio: optionalText(1000),
    education_notes: optionalText(1000),
    montessori_notes: optionalText(1000),
    notable_achievements: z.array(z.string().trim().min(1)).optional(),
    contributions: z
      .array(z.object({ title: z.string().trim().min(1), type: z.string().default("other") }))
      .optional(),
    quotes: z.array(z.string().trim().min(1)).optional(),
    links: z.array(z.object({ type: z.enum(LINK_TYPES), url })).optional(),
  })
  .superRefine((value, ctx) => {
    for (const issue of crossFieldIssues(value)) {
      ctx.addIssue({ code: "custom", ...issue });
    }
  });

type CrossFieldInput = {
  kinds?: string[];
  roles?: string[];
  sources?: { type?: string; url?: string; note?: string }[];
};

/**
 * Checks that span fields. Exported because zod skips object refinements while
 * any field is invalid; the form runs these itself so every problem shows at once.
 */
export function crossFieldIssues(value: CrossFieldInput) {
  const issues: { path: (string | number)[]; message: string }[] = [];
  if (value.kinds?.includes("contributor") && !value.roles?.length) {
    issues.push({ path: ["roles"], message: "Pick at least one role" });
  }
  for (const [i, source] of (value.sources ?? []).entries()) {
    const personal = source.type === "personal-knowledge";
    if (personal ? !source.note?.trim() : !source.url?.trim()) {
      issues.push({
        path: ["sources", i],
        message: personal ? "Tell us how you know them" : "Add a link to the source",
      });
    }
  }
  return issues;
}

export type Submission = z.infer<typeof submissionSchema>;

export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const tagSlug = (tag: string) => slugify(tag);

/** New organizations named in a submission, which maintainers add to data/organizations. */
export function newOrganizations(s: Submission): string[] {
  return [...(s.schools ?? []), ...(s.affiliations ?? [])]
    .filter((o) => !o.organization)
    .map((o) => o.name);
}

const toRefs = (refs: Submission["schools"]) =>
  refs?.map((r) => ({
    organization: r.organization ?? slugify(r.name),
    ...(r.role ? { role: r.role } : {}),
  }));

/** The profile YAML a maintainer would commit, minus the id. */
export function submissionToYaml(s: Submission): string {
  const isAlum = s.kinds.includes("alum");
  const isContributor = s.kinds.includes("contributor");
  const doc: Record<string, unknown> = {
    name: s.name,
    slug: slugify(s.name),
    ...(isContributor
      ? { kind: isAlum ? ["alum", "contributor"] : "contributor", roles: s.roles }
      : {}),
    tagline: s.tagline,
    bio: s.bio,
    tags: s.tags.map(tagSlug),
    ...(isAlum
      ? {
          education: ["montessori"],
          education_notes: s.education_notes,
          schools: toRefs(s.schools),
        }
      : {}),
    montessori_notes: isContributor ? s.montessori_notes : undefined,
    affiliations: toRefs(s.affiliations),
    contributions: isContributor ? s.contributions : undefined,
    notable_achievements: isAlum ? s.notable_achievements : undefined,
    quotes: s.quotes,
    sources: s.sources,
    verification: s.sources.some((src) => src.type === "personal-knowledge")
      ? "reported"
      : undefined,
    status: "provisional",
    links: s.links,
  };
  const clean = Object.fromEntries(
    Object.entries(doc).filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
  );
  const added = newOrganizations(s);
  const note = added.length
    ? `# New organizations for maintainers to add: ${added.join(", ")}\n`
    : "";
  return `id: # assigned by maintainers (bun run id:next)\n${yaml.dump(clean, { lineWidth: 120 })}${note}`;
}

/**
 * Parse YAML typed into the form's YAML mode back into a submission. Slugs not
 * in `knownOrganizations` are treated as new organizations.
 */
export function yamlToSubmission(
  text: string,
  knownOrganizations: Map<string, string> = new Map()
): unknown {
  const doc = (yaml.load(text) ?? {}) as Record<string, unknown>;
  const kinds = [doc.kind ?? "alum"].flat().filter((k) => k === "alum" || k === "contributor");
  const fromRefs = (refs: unknown) =>
    Array.isArray(refs)
      ? refs.map((ref: { organization?: unknown; role?: unknown }) => {
          const slug = String(ref?.organization ?? "");
          const known = knownOrganizations.get(slug);
          return {
            organization: known ? slug : undefined,
            name: known ?? toTitleCase(slug.replace(/-/g, " ")),
            role: ref?.role,
          };
        })
      : undefined;
  return {
    ...doc,
    schools: fromRefs(doc.schools),
    affiliations: fromRefs(doc.affiliations),
    kinds: kinds.length ? kinds : ["alum"],
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    sources: Array.isArray(doc.sources) ? doc.sources : [],
  };
}

export function issueTitle(s: Pick<Submission, "kinds" | "name">) {
  return `${s.kinds.includes("contributor") ? "New contributor" : "New profile"}: ${s.name}`;
}

export function issueBody(s: Submission): string {
  return [
    `Submitted through the contribute form on themontessorians.xyz.`,
    "",
    "```yaml",
    submissionToYaml(s).trimEnd(),
    "```",
    "",
    ...(newOrganizations(s).length
      ? [`**New organizations to add:** ${newOrganizations(s).join(", ")}`, ""]
      : []),
    "**Maintainer checklist**",
    "- [ ] Not a duplicate (search the directory and `bun run validate`)",
    "- [ ] Sources support the Montessori connection",
    "- [ ] Assign an id with `bun run id:next`",
    "- [ ] Add a photo to `images/` with an `image_credit`, if available",
  ].join("\n");
}

/** Prefilled GitHub issue (issue form 01_profile_request.yml), for the GitHub route. */
export function githubSubmissionUrl(s: Partial<Submission> & { kinds: Submission["kinds"] }) {
  const firstSource = s.sources?.[0];
  return githubIssueUrl("01_profile_request.yml", {
    title: s.name ? issueTitle({ kinds: s.kinds, name: s.name }) : undefined,
    kind: s.kinds.includes("contributor") ? "Contributed to the field" : "Attended Montessori",
    name: s.name,
    tagline: s.tagline,
    tags: s.tags?.join(", "),
    source_type: firstSource?.type,
    source: firstSource?.url ?? firstSource?.note,
  });
}
