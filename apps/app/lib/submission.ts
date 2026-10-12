import yaml from "js-yaml";
import { z } from "zod";
import { CONTRIBUTOR_ROLES, LINK_TYPES, SOURCE_TYPES } from "@/lib/content/types";
import { githubIssueUrl } from "@/lib/url";

// A "suggest a Montessorian" submission. Shared by the contribute form (client)
// and /api/submit (server), and mirrors profile.schema.json — minus `id`, which
// maintainers assign when they accept the submission.

const optionalText = (max?: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    (max ? z.string().trim().max(max) : z.string().trim()).optional()
  );

const url = z.string().trim().url();

export const submissionSchema = z
  .object({
    kind: z.enum(["alum", "contributor"]),
    name: z.string().trim().min(2, "Add their full name").max(120),
    tagline: z
      .string()
      .trim()
      .min(3, "Add a short tagline")
      .max(100, "Keep the tagline under 100 characters")
      .refine((t) => !t.endsWith("."), "Taglines don't end with a period"),
    tags: z.array(z.string().trim().min(1)).min(1, "Add at least one tag").max(8),
    roles: z.array(z.enum(CONTRIBUTOR_ROLES)).optional(),
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
    if (value.kind === "contributor" && !value.roles?.length) {
      ctx.addIssue({ code: "custom", path: ["roles"], message: "Pick at least one role" });
    }
    for (const [i, source] of value.sources.entries()) {
      if (source.type === "personal-knowledge" ? !source.note : !source.url) {
        ctx.addIssue({
          code: "custom",
          path: ["sources", i],
          message:
            source.type === "personal-knowledge"
              ? "Tell us how you know them"
              : "Add a link to the source",
        });
      }
    }
  });

export type Submission = z.infer<typeof submissionSchema>;

export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const tagSlug = (tag: string) => slugify(tag);

/** The profile YAML a maintainer would commit, minus the id. */
export function submissionToYaml(s: Submission): string {
  const isContributor = s.kind === "contributor";
  const doc: Record<string, unknown> = {
    name: s.name,
    slug: slugify(s.name),
    ...(isContributor ? { kind: "contributor", roles: s.roles } : {}),
    tagline: s.tagline,
    bio: s.bio,
    tags: s.tags.map(tagSlug),
    ...(isContributor ? {} : { education: ["montessori"], education_notes: s.education_notes }),
    montessori_notes: isContributor ? s.montessori_notes : undefined,
    contributions: isContributor ? s.contributions : undefined,
    notable_achievements: isContributor ? undefined : s.notable_achievements,
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
  return `id: # assigned by maintainers (bun run id:next)\n${yaml.dump(clean, { lineWidth: 120 })}`;
}

/** Parse YAML typed into the form's YAML mode back into a submission. */
export function yamlToSubmission(text: string): unknown {
  const doc = (yaml.load(text) ?? {}) as Record<string, unknown>;
  return {
    ...doc,
    kind: doc.kind === "contributor" ? "contributor" : "alum",
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    sources: Array.isArray(doc.sources) ? doc.sources : [],
  };
}

export function issueTitle(s: Pick<Submission, "kind" | "name">) {
  return `${s.kind === "contributor" ? "New contributor" : "New profile"}: ${s.name}`;
}

export function issueBody(s: Submission): string {
  return [
    `Submitted through the contribute form on themontessorians.xyz.`,
    "",
    "```yaml",
    submissionToYaml(s).trimEnd(),
    "```",
    "",
    "**Maintainer checklist**",
    "- [ ] Not a duplicate (search the directory and `bun run validate`)",
    "- [ ] Sources support the Montessori connection",
    "- [ ] Assign an id with `bun run id:next`",
    "- [ ] Add a photo to `images/` with an `image_credit`, if available",
  ].join("\n");
}

/** Prefilled GitHub issue (issue form 01_profile_request.yml), for the GitHub route. */
export function githubSubmissionUrl(s: Partial<Submission> & { kind: Submission["kind"] }) {
  const firstSource = s.sources?.[0];
  return githubIssueUrl("01_profile_request.yml", {
    title: s.name ? issueTitle({ kind: s.kind, name: s.name }) : undefined,
    kind: s.kind === "contributor" ? "Contributed to the field" : "Attended Montessori",
    name: s.name,
    tagline: s.tagline,
    tags: s.tags?.join(", "),
    source_type: firstSource?.type,
    source: firstSource?.url ?? firstSource?.note,
  });
}
