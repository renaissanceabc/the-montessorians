import { dump, load } from "js-yaml";
import { z } from "zod";

import { CONTRIBUTOR_ROLES, LINK_TYPES, SOURCE_TYPES } from "@/lib/content/types";
import { githubIssueUrl } from "@/lib/url";
import { toTitleCase } from "@/lib/utils";

// A "suggest a Montessorian" submission. Shared by the contribute form (client)
// and /api/submit (server), and mirrors profile.schema.json — minus `id`, which
// maintainers assign when they accept the submission.

// Optional free text: trimmed, and a blank answer counts as not given.
const optionalText = (max?: number) =>
  (max ? z.string().trim().max(max) : z.string().trim())
    .optional()
    .transform((t) => (t === "" ? undefined : t));

const url = z.string().trim().url("Enter a full link, starting with https://");

const organizationRef = z.object({
  name: z.string().trim().min(2),
  /** Existing organization slug; omitted for a new organization */
  organization: z.string().optional(),
  role: optionalText(120),
});

interface CrossFieldInput {
  kinds?: string[];
  roles?: string[];
  sources?: { type?: string; url?: string; note?: string }[];
}

/**
 * Checks that span fields. Exported because zod skips object refinements while
 * any field is invalid; the form runs these itself so every problem shows at once.
 */
export const crossFieldIssues = (value: CrossFieldInput) => {
  const issues: { path: (string | number)[]; message: string }[] = [];
  if (value.kinds?.includes("contributor") && !value.roles?.length) {
    issues.push({ message: "Pick at least one role", path: ["roles"] });
  }
  for (const [i, source] of (value.sources ?? []).entries()) {
    const personal = source.type === "personal-knowledge";
    if (personal ? !source.note?.trim() : !source.url?.trim()) {
      issues.push({
        message: personal ? "Tell us how you know them" : "Add a link to the source",
        path: ["sources", i],
      });
    }
  }
  return issues;
};

export const submissionSchema = z
  .object({
    affiliations: z.array(organizationRef).optional(),
    bio: optionalText(1000),
    contributions: z
      .array(z.object({ title: z.string().trim().min(1), type: z.string().default("other") }))
      .optional(),
    education_notes: optionalText(1000),
    kinds: z
      .array(z.enum(["alum", "contributor"]))
      .min(1, "Pick at least one")
      .max(2),
    links: z.array(z.object({ type: z.enum(LINK_TYPES), url })).optional(),
    montessori_notes: optionalText(1000),
    name: z.string().trim().min(2, "Add their full name").max(120),
    notable_achievements: z.array(z.string().trim().min(1)).optional(),
    quotes: z.array(z.string().trim().min(1)).optional(),
    roles: z.array(z.enum(CONTRIBUTOR_ROLES)).optional(),
    schools: z.array(organizationRef).optional(),
    sources: z
      .array(
        z.object({
          note: optionalText(300),
          type: z.enum(SOURCE_TYPES),
          url: url.optional(),
        })
      )
      .min(1, "Tell us how you know"),
    tagline: z
      .string()
      .trim()
      .min(3, "Add a short tagline")
      .max(100, "Keep the tagline under 100 characters")
      .refine((t) => !t.endsWith("."), "Taglines don't end with a period"),
    tags: z.array(z.string().trim().min(1)).min(1, "Add at least one tag").max(8),
  })
  .superRefine((value, ctx) => {
    for (const issue of crossFieldIssues(value)) {
      ctx.addIssue({ code: "custom", ...issue });
    }
  });

export type Submission = z.infer<typeof submissionSchema>;

export const slugify = (name: string) =>
  name
    .normalize("NFKD")
    .replaceAll(/[̀-ͯ]/gu, "")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/^-|-$/gu, "");

const tagSlug = (tag: string) => slugify(tag);

/** New organizations named in a submission, which maintainers add to data/organizations. */
export const newOrganizations = (s: Submission): string[] =>
  [...(s.schools ?? []), ...(s.affiliations ?? [])]
    .filter((o) => !o.organization)
    .map((o) => o.name);

/** A school or affiliation as written in profile YAML. */
interface OrganizationYamlRef {
  organization: string;
  role?: string;
}

const toRefs = (refs: Submission["schools"]) =>
  refs?.map((r) => {
    const ref: OrganizationYamlRef = { organization: r.organization ?? slugify(r.name) };
    if (r.role) {
      ref.role = r.role;
    }
    return ref;
  });

type Source = Submission["sources"][number];

/** A source with its keys in profile YAML order (type, url, note); unset keys are left out. */
const toYamlSource = (src: Source) =>
  Object.fromEntries(
    [
      ["type", src.type],
      ["url", src.url],
      ["note", src.note],
    ].filter(([, v]) => v !== undefined)
  );

/** A value in the profile YAML document. */
type ProfileYamlValue =
  | Submission[keyof Submission]
  | OrganizationYamlRef[]
  | ReturnType<typeof toYamlSource>[]
  | string
  | string[];

/** The profile YAML a maintainer would commit, minus the id. */
// Shown even when empty in a draft, so the YAML editor lists what's required.
const DRAFT_REQUIRED_KEYS = new Set(["name", "tagline", "tags"]);

/**
 * The profile YAML for a submission. With `draft`, it accepts an incomplete
 * submission: required fields stay as blank keys instead of being dropped.
 */
export const submissionToYaml = (s: Submission, { draft = false } = {}): string => {
  const isAlum = s.kinds.includes("alum");
  const isContributor = s.kinds.includes("contributor");
  // Entries, not an object literal: the YAML keeps the profile files' field order.
  const entries: [string, ProfileYamlValue][] = [
    ["name", s.name],
    ["slug", slugify(s.name)],
  ];
  if (isContributor) {
    entries.push(["kind", isAlum ? ["alum", "contributor"] : "contributor"], ["roles", s.roles]);
  }
  entries.push(["tagline", s.tagline], ["bio", s.bio], ["tags", s.tags.map(tagSlug)]);
  if (isAlum) {
    entries.push(
      ["education", ["montessori"]],
      ["education_notes", s.education_notes],
      ["schools", toRefs(s.schools)]
    );
  }
  entries.push(
    ["montessori_notes", isContributor ? s.montessori_notes : undefined],
    ["affiliations", toRefs(s.affiliations)],
    ["contributions", isContributor ? s.contributions : undefined],
    ["notable_achievements", isAlum ? s.notable_achievements : undefined],
    ["quotes", s.quotes],
    ["sources", s.sources.map(toYamlSource)],
    [
      "verification",
      s.sources.some((src) => src.type === "personal-knowledge") ? "reported" : undefined,
    ],
    ["status", "provisional"],
    ["links", s.links]
  );
  const clean = Object.fromEntries(
    entries.filter(
      ([key, v]) =>
        (draft && DRAFT_REQUIRED_KEYS.has(key)) ||
        (v !== undefined && !(Array.isArray(v) && v.length === 0))
    )
  );
  const added = newOrganizations(s);
  const note = added.length
    ? `# New organizations for maintainers to add: ${added.join(", ")}\n`
    : "";
  // Blank strings read better as empty keys (`name:`) than as `name: ''`.
  const body = dump(clean, { lineWidth: 120 }).replaceAll(/^(?<key>\w+): ''$/gmu, "$<key>:");
  return `id: # assigned by maintainers (bun run id:next)\n${body}${note}`;
};

/** A node of a parsed YAML document (js-yaml's default schema). */
export type YamlNode = string | number | boolean | null | Date | Uint8Array | YamlNode[] | YamlMap;

/** A YAML mapping. */
export interface YamlMap {
  [key: string]: YamlNode;
}

const isYamlMap = (node: YamlNode | undefined): node is YamlMap =>
  node instanceof Object &&
  !Array.isArray(node) &&
  !(node instanceof Date) &&
  !(node instanceof Uint8Array);

/** A field of a mapping; other nodes (scalars, lists) have no fields. */
const fieldOf = (node: YamlNode | undefined, key: string): YamlNode | undefined =>
  isYamlMap(node) ? node[key] : undefined;

/**
 * Parse YAML typed into the form's YAML mode back into a submission. Slugs not
 * in `knownOrganizations` are treated as new organizations.
 */
export const yamlToSubmission = (text: string, knownOrganizations = new Map<string, string>()) => {
  // SAFETY: with js-yaml's default schema, load() only produces strings, numbers,
  // booleans, null, Dates, Uint8Arrays (!!binary), arrays, and plain objects.
  const loaded = load(text) as YamlNode | undefined;
  const doc: YamlMap = isYamlMap(loaded) ? loaded : {};
  const kinds = [doc.kind ?? "alum"].flat().filter((k) => k === "alum" || k === "contributor");
  const fromRefs = (refs: YamlNode | undefined) =>
    Array.isArray(refs)
      ? refs.map((ref) => {
          const slug = String(fieldOf(ref, "organization") ?? "");
          const known = knownOrganizations.get(slug);
          return {
            name: known ?? toTitleCase(slug.replaceAll("-", " ")),
            organization: known ? slug : undefined,
            role: fieldOf(ref, "role"),
          };
        })
      : undefined;
  return {
    ...doc,
    affiliations: fromRefs(doc.affiliations),
    kinds: kinds.length ? kinds : ["alum"],
    schools: fromRefs(doc.schools),
    sources: Array.isArray(doc.sources) ? doc.sources : [],
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
  };
};

export const issueTitle = (s: Pick<Submission, "kinds" | "name">) =>
  `${s.kinds.includes("contributor") ? "New contributor" : "New profile"}: ${s.name}`;

export const issueBody = (s: Submission): string =>
  [
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

/** Prefilled GitHub issue (issue form 01_profile_request.yml), for the GitHub route. */
export const githubSubmissionUrl = (s: Partial<Submission> & { kinds: Submission["kinds"] }) => {
  const firstSource = s.sources?.[0];
  return githubIssueUrl("01_profile_request.yml", {
    kind: s.kinds.includes("contributor") ? "Contributed to the field" : "Attended Montessori",
    name: s.name,
    source: firstSource?.url ?? firstSource?.note,
    source_type: firstSource?.type,
    tagline: s.tagline,
    tags: s.tags?.join(", "),
    title: s.name ? issueTitle({ kinds: s.kinds, name: s.name }) : undefined,
  });
};
