"use client";

import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Control, FieldErrors, Resolver, UseFieldArrayReturn } from "react-hook-form";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CONTRIBUTOR_ROLE_LABELS, CONTRIBUTOR_ROLES, LINK_TYPES } from "@/lib/content/types";
import type { SourceType, Tag } from "@/lib/content/types";
import {
  crossFieldIssues,
  githubSubmissionUrl,
  submissionSchema,
  submissionToYaml,
  yamlToSubmission,
} from "@/lib/submission";
import type { Submission } from "@/lib/submission";
import { cn, toTitleCase } from "@/lib/utils";

import { OrganizationPicker } from "./organization-picker";
import type { OrganizationOption, PickedOrganization } from "./organization-picker";
import { TagInput } from "./tag-input";

type Kind = Submission["kinds"][number];
type Mode = "form" | "yaml";
type LinkType = (typeof LINK_TYPES)[number];

interface FormValues {
  kinds: Kind[];
  name: string;
  roles: string[];
  schools: PickedOrganization[];
  affiliations: PickedOrganization[];
  tagline: string;
  tags: string[];
  sourceType: SourceType;
  sourceUrl: string;
  sourceNote: string;
  bio: string;
  notes: string;
  highlights: string;
  quote: string;
  links: { type: LinkType; url: string }[];
}

const DEFAULT_VALUES: FormValues = {
  affiliations: [],
  bio: "",
  highlights: "",
  kinds: [],
  links: [{ type: "wikipedia", url: "" }],
  name: "",
  notes: "",
  quote: "",
  roles: [],
  schools: [],
  sourceNote: "",
  sourceType: "wikipedia",
  sourceUrl: "",
  tagline: "",
  tags: [],
};

const KIND_OPTIONS = [
  { Icon: GraduationCapIcon, hint: "An alum", label: "Attended Montessori", value: "alum" },
  {
    Icon: BookOpenIcon,
    hint: "Researcher, author, philosopher, founder…",
    label: "Contributed to the field",
    value: "contributor",
  },
] as const;

const SOURCE_OPTIONS: { type: SourceType; label: string; placeholder: string }[] = [
  { label: "Wikipedia", placeholder: "https://en.wikipedia.org/wiki/…", type: "wikipedia" },
  { label: "Article or interview", placeholder: "https://…", type: "article" },
  { label: "Social post", placeholder: "https://x.com/…", type: "social" },
  { label: "Book or publication", placeholder: "DOI, ISBN page, or URL", type: "publication" },
  { label: "Personal knowledge", placeholder: "", type: "personal-knowledge" },
  { label: "Other", placeholder: "https://…", type: "other" },
];

const LINK_LABELS: Record<LinkType, string> = {
  article: "Article",
  imdb: "IMDb",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  tiktok: "TikTok",
  website: "Website",
  wikipedia: "Wikipedia",
  x: "X",
  youtube: "YouTube",
};

const LINK_ITEMS = LINK_TYPES.map((type) => ({ label: LINK_LABELS[type], value: type }));

/** Fields in page order, with the label used in the error summary. */
const FIELD_ORDER: { name: keyof FormValues; label: string }[] = [
  { label: "They…", name: "kinds" },
  { label: "Full name", name: "name" },
  { label: "Role", name: "roles" },
  { label: "Montessori school", name: "schools" },
  { label: "Affiliations", name: "affiliations" },
  { label: "Tagline", name: "tagline" },
  { label: "Tags", name: "tags" },
  { label: "Source", name: "sourceUrl" },
  { label: "Source", name: "sourceNote" },
  { label: "Bio", name: "bio" },
  { label: "Notes", name: "notes" },
  { label: "Highlights", name: "highlights" },
  { label: "Quote", name: "quote" },
  { label: "Links", name: "links" },
];

const fieldId = (name: string) => `contribute-${name.replaceAll(".", "-")}`;

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** The form's values as a submission (unvalidated). */
const toDraft = (v: FormValues) => {
  const isAlum = v.kinds.includes("alum");
  const isContributor = v.kinds.includes("contributor");
  const personal = v.sourceType === "personal-knowledge";
  return {
    affiliations: isContributor && v.affiliations.length ? v.affiliations : undefined,
    bio: v.bio,
    contributions: isContributor
      ? lines(v.highlights).map((title) => ({ title, type: "other" }))
      : undefined,
    education_notes: isAlum ? v.notes : undefined,
    kinds: v.kinds,
    links: v.links.filter((l) => l.url.trim()).map((l) => ({ type: l.type, url: l.url.trim() })),
    montessori_notes: isContributor && !isAlum ? v.notes : undefined,
    name: v.name,
    notable_achievements: isContributor ? undefined : lines(v.highlights),
    quotes: v.quote.trim() ? [v.quote.trim()] : undefined,
    roles: isContributor ? v.roles : undefined,
    schools: isAlum && v.schools.length ? v.schools : undefined,
    sources: [
      personal
        ? { note: v.sourceNote, type: v.sourceType }
        : { type: v.sourceType, url: v.sourceUrl.trim() || undefined },
    ],
    tagline: v.tagline,
    tags: v.tags,
  };
};

/** The source fields of the form, from a submission's first source. */
const toSourceValues = (
  source: Submission["sources"][number] | undefined
): Pick<FormValues, "sourceNote" | "sourceType" | "sourceUrl"> => ({
  sourceNote: source?.note ?? "",
  sourceType: source?.type ?? "wikipedia",
  sourceUrl: source?.url ?? "",
});

/** The free-text fields of the form, from a submission. */
const toTextValues = (
  s: Partial<Submission>
): Pick<FormValues, "bio" | "highlights" | "notes" | "quote" | "tagline"> => ({
  bio: s.bio ?? "",
  highlights: (s.notable_achievements ?? s.contributions?.map((c) => c.title) ?? []).join("\n"),
  notes: s.education_notes ?? s.montessori_notes ?? "",
  quote: s.quotes?.[0] ?? "",
  tagline: s.tagline ?? "",
});

/** A parsed submission back into form values (for YAML → form). */
const toValues = (s: Partial<Submission>): FormValues => ({
  ...DEFAULT_VALUES,
  ...toTextValues(s),
  ...toSourceValues(s.sources?.[0]),
  affiliations: s.affiliations ?? [],
  kinds: s.kinds ?? [],
  links: s.links?.length ? s.links : DEFAULT_VALUES.links,
  name: s.name ?? "",
  roles: s.roles ?? [],
  schools: s.schools ?? [],
  tags: (s.tags ?? []).map((t) => toTitleCase(t.replaceAll("-", " "))),
});

/** Which form field a submission issue belongs to. */
const fieldFor = (path: PropertyKey[], v: FormValues): string => {
  const [head, index] = path;
  switch (head) {
    case "sources": {
      return v.sourceType === "personal-knowledge" ? "sourceNote" : "sourceUrl";
    }
    case "education_notes":
    case "montessori_notes": {
      return "notes";
    }
    case "notable_achievements":
    case "contributions": {
      return "highlights";
    }
    case "quotes": {
      return "quote";
    }
    case "links": {
      // Empty rows are dropped from the draft, so map back to the row on screen.
      const rows = v.links.flatMap((l, i) => (l.url.trim() ? [i] : []));
      const row = Number.isInteger(index) ? rows[Number(index)] : undefined;
      return row === undefined ? "links" : `links.${row}.url`;
    }
    default: {
      return String(head ?? "root");
    }
  }
};

interface ErrorLeaf {
  message: string;
  type: "validation";
}

/** Nested field errors in react-hook-form's layout (arrays for numeric segments). */
interface ErrorTree {
  [key: string]: ErrorLeaf | ErrorTree | ErrorTree[];
}

const setError = (errors: ErrorTree, name: string, message: string) => {
  const parts = name.split(".");
  let node = errors;
  for (const [i, part] of parts.entries()) {
    if (i === parts.length - 1) {
      node[part] ??= { message, type: "validation" };
    } else {
      // react-hook-form keeps array fields (numeric segments) as arrays.
      node[part] ??= /^\d+$/u.test(parts[i + 1]) ? [] : {};
      // SAFETY: only the last segment holds a leaf, so this is a tree or an array set
      // above; an array indexed by string keys behaves like the tree it stands in for.
      node = node[part] as ErrorTree;
    }
  }
};

const issuesFor = (draft: ReturnType<typeof toDraft>) => {
  const parsed = submissionSchema.safeParse(draft);
  if (parsed.success) {
    return [];
  }
  // Zod skips the cross-field checks while other fields fail; run them anyway.
  return [
    ...parsed.error.issues.map((i) => ({ message: i.message, path: i.path })),
    ...crossFieldIssues(draft),
  ];
};

const resolver: Resolver<FormValues> = (values) => {
  const issues = issuesFor(toDraft(values));
  if (!issues.length) {
    return { errors: {}, values };
  }
  const errors: ErrorTree = {};
  for (const issue of issues) {
    setError(errors, fieldFor(issue.path, values), issue.message);
  }
  // SAFETY: setError builds the nested { message, type } layout FieldErrors describes,
  // keyed by the form field names fieldFor returns.
  return { errors: errors as FieldErrors<FormValues>, values: {} };
};

/** Flatten nested errors into [name, message] pairs in page order. */
const errorList = (errors: FieldErrors<FormValues>) => {
  const out: { name: string; label: string; message: string }[] = [];
  for (const { name, label } of FIELD_ORDER) {
    const error = errors[name];
    if (!error) {
      continue;
    }
    if (name === "links" && Array.isArray(error)) {
      for (const [i, row] of error.entries()) {
        if (row?.url?.message) {
          out.push({ label: `Link ${i + 1}`, message: row.url.message, name: `links.${i}.url` });
        }
      }
    } else if ("message" in error && error.message) {
      out.push({ label, message: String(error.message), name });
    }
  }
  return out;
};

const focusField = (name: string) => {
  const el = document.querySelector<HTMLElement>(`#${CSS.escape(fieldId(name))}`);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  el?.focus({ preventScroll: true });
};

interface ServerProblem {
  title: string;
  detail: string;
}

const problemFor = (status: number): ServerProblem => {
  switch (status) {
    case 400: {
      return {
        detail: "The fields marked below didn't pass our checks.",
        title: "Some details need another look",
      };
    }
    case 403: {
      return {
        detail: "It was flagged as automated. Open it on GitHub instead; everything is filled in.",
        title: "We couldn't accept this from your browser",
      };
    }
    case 429: {
      return {
        detail:
          "You've hit the hourly limit for this form. Open it on GitHub instead; everything you entered is filled in.",
        title: "That's a lot of submissions, thank you!",
      };
    }
    case 503: {
      return {
        detail: "Open it on GitHub instead; everything you entered is filled in.",
        title: "Direct submissions aren't switched on yet",
      };
    }
    default: {
      return {
        detail: `The request failed (error ${status}). Try again, or open it on GitHub.`,
        title: "Something went wrong on our side",
      };
    }
  }
};

interface YamlParseResult {
  submission?: Submission;
  errors: string[];
}

/** The fields a js-yaml YAMLException (or a plain Error) carries. */
interface YamlParseError {
  reason?: string;
  mark?: { line: number };
  message?: string;
}

const sourceQuestion = (isContributor: boolean, isAlum: boolean) => {
  if (isContributor) {
    return "Where is their contribution documented?";
  }
  if (isAlum) {
    return "How do we know they attended Montessori?";
  }
  return "How do we know about them?";
};

const PickKindHint = () => (
  <div className="text-muted-foreground flex flex-col items-center gap-2 rounded-lg border border-dashed border-black/15 px-6 py-10 text-center text-sm">
    <AlertCircleIcon className="size-5" />
    <p className="max-w-sm text-balance">
      Pick one or both above to start. We&apos;ll show the fields that fit: their Montessori school
      for alumni, or roles, affiliations, and published work for contributors.
    </p>
  </div>
);

const YamlField = ({
  errors,
  onTextChange,
  reference,
  text,
}: {
  errors: string[];
  onTextChange: (text: string) => void;
  reference?: ReactNode;
  text: string;
}) => (
  <div className="flex flex-col gap-6">
    <Field data-invalid={errors.length > 0 || undefined}>
      <FieldLabel htmlFor={fieldId("yaml")}>Profile YAML</FieldLabel>
      <Textarea
        aria-invalid={errors.length > 0 || undefined}
        className="min-h-96 font-mono text-xs leading-relaxed"
        id={fieldId("yaml")}
        onChange={(e) => onTextChange(e.target.value)}
        spellCheck={false}
        value={text}
      />
      {errors.length ? (
        <FieldError errors={errors.map((message) => ({ message }))} />
      ) : (
        <FieldDescription>
          Checked against the profile schema before it&apos;s sent. Switch back to Form to keep
          editing with these values.
        </FieldDescription>
      )}
    </Field>
    {reference}
  </div>
);

const FormFooter = ({
  errors,
  githubUrl,
  problem,
  showSummary,
  submitting,
}: {
  errors: ReturnType<typeof errorList>;
  githubUrl: string;
  problem: ServerProblem | null;
  showSummary: boolean;
  submitting: boolean;
}) => (
  <div className="flex flex-col gap-4 border-t border-black/10 pt-6">
    {showSummary && (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>
          {errors.length === 1 ? "One thing to fix" : `${errors.length} things to fix`}
        </AlertTitle>
        <AlertDescription>
          <ul className="flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error.name}>
                <button
                  className="text-left underline-offset-2 hover:underline"
                  onClick={() => focusField(error.name)}
                  type="button"
                >
                  <span className="font-medium">{error.label}:</span> {error.message}
                </button>
              </li>
            ))}
          </ul>
        </AlertDescription>
      </Alert>
    )}

    {problem && (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>{problem.title}</AlertTitle>
        <AlertDescription>
          <p>{problem.detail}</p>
          <Button
            className="text-foreground mt-2 w-full no-underline sm:w-auto"
            nativeButton={false}
            render={<Link href={githubUrl} rel="noopener" target="_blank" />}
            size="sm"
            variant="outline"
          >
            Open it on GitHub
            <ArrowUpRightIcon data-icon="inline-end" />
          </Button>
        </AlertDescription>
      </Alert>
    )}

    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <Button className="w-full sm:w-auto" disabled={submitting} size="lg" type="submit">
        {submitting ? "Submitting…" : "Submit for review"}
      </Button>
      <Link
        className="text-muted-foreground text-center text-sm hover:underline sm:text-left"
        href={githubUrl}
        target="_blank"
      >
        or open it as a GitHub issue
      </Link>
    </div>
    <p className="text-muted-foreground text-xs">
      Nothing is published until a maintainer reviews it.
    </p>
  </div>
);

/** Links, one row per link type: a row offers its own type plus the unused ones. */
const LinksFieldSet = ({
  control,
  links,
}: {
  control: Control<FormValues>;
  links: UseFieldArrayReturn<FormValues, "links">;
}) => {
  const linkValues = useWatch({ control, name: "links" });
  const usedLinkTypes = new Set(linkValues.map((link) => link.type));
  const unusedLinkTypes = LINK_TYPES.filter((type) => !usedLinkTypes.has(type));
  const linkItemsFor = (current: LinkType) =>
    LINK_ITEMS.filter((item) => item.value === current || !usedLinkTypes.has(item.value));
  return (
    <FieldSet>
      <FieldLegend variant="label">Links</FieldLegend>
      <div className="flex flex-col gap-2">
        {links.fields.map((row, i) => (
          <Controller
            control={control}
            key={row.id}
            name={`links.${i}.url`}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <div className="flex gap-2">
                  <Controller
                    control={control}
                    name={`links.${i}.type`}
                    render={({ field: typeField }) => (
                      <Select
                        items={linkItemsFor(typeField.value)}
                        onValueChange={(next) => next && typeField.onChange(next)}
                        value={typeField.value}
                      >
                        <SelectTrigger aria-label="Link type" className="w-28 shrink-0 sm:w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {linkItemsFor(typeField.value).map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid || undefined}
                    aria-label="Link URL"
                    id={fieldId(`links.${i}.url`)}
                    inputMode="url"
                    placeholder="https://…"
                    type="url"
                  />
                  {links.fields.length > 1 && (
                    <Button
                      aria-label="Remove link"
                      className="shrink-0"
                      onClick={() => links.remove(i)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <XIcon />
                    </Button>
                  )}
                </div>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        ))}
      </div>
      {unusedLinkTypes.length > 0 && (
        <Button
          className="self-start"
          onClick={() => links.append({ type: unusedLinkTypes[0], url: "" })}
          size="sm"
          type="button"
          variant="ghost"
        >
          <PlusIcon />
          Add another link
        </Button>
      )}
    </FieldSet>
  );
};

export const ContributeForm = ({
  organizations,
  tagSuggestions,
  yamlReference,
}: {
  organizations: OrganizationOption[];
  tagSuggestions: Tag[];
  /** Field reference shown beside the YAML editor (rendered on the server). */
  yamlReference?: ReactNode;
}) => {
  const knownOrganizations = new Map(organizations.map((o) => [o.slug, o.name]));
  const form = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    mode: "onSubmit",
    reValidateMode: "onChange",
    resolver,
    shouldFocusError: false,
  });
  const { control, handleSubmit, formState, reset, getValues } = form;
  const links = useFieldArray({ control, name: "links" });
  // SAFETY: every field has a default value, so the watched values are always complete.
  const values = useWatch({ control }) as FormValues;

  const [mode, setMode] = useState<Mode>("form");
  // The YAML generated from the form, to tell whether it was edited.
  const generatedYaml = useRef("");
  const [yamlText, setYamlText] = useState("");
  const [yamlErrors, setYamlErrors] = useState<string[]>([]);
  const [problem, setProblem] = useState<ServerProblem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ url: string } | null>(null);

  const kinds = values.kinds ?? [];
  const isAlum = kinds.includes("alum");
  const isContributor = kinds.includes("contributor");
  const hasKind = kinds.length > 0;
  const isPersonal = values.sourceType === "personal-knowledge";
  const source = SOURCE_OPTIONS.find((s) => s.type === values.sourceType);
  const errors = errorList(formState.errors);
  const showSummary = formState.submitCount > 0 && errors.length > 0;

  // SAFETY: the draft has the submission's field names and types; githubSubmissionUrl
  // only prefills an issue, so it accepts values that haven't been validated yet.
  const githubUrl = githubSubmissionUrl(
    toDraft(getValues()) as Partial<Submission> & { kinds: Kind[] }
  );

  const parseYaml = (): YamlParseResult => {
    let candidate: unknown;
    try {
      candidate = yamlToSubmission(yamlText, knownOrganizations);
    } catch (error) {
      // SAFETY: yamlToSubmission throws js-yaml's YAMLException or a plain Error; every
      // field read below is optional and checked before use.
      const e = error as YamlParseError;
      return {
        errors: [
          e.mark
            ? `Line ${e.mark.line + 1}: ${e.reason ?? "invalid YAML"}`
            : (e.message ?? "Invalid YAML"),
        ],
      };
    }
    const parsed = submissionSchema.safeParse(candidate);
    if (parsed.success) {
      return { errors: [], submission: parsed.data };
    }
    // SAFETY: crossFieldIssues reads kinds, roles, and sources with optional chaining,
    // so a partially valid candidate is safe to check.
    const issues = [
      ...parsed.error.issues,
      ...crossFieldIssues(candidate as Parameters<typeof crossFieldIssues>[0]),
    ];
    return {
      errors: [
        ...new Set(
          issues.map((i) => `${i.path.length ? `${i.path.join(".")}: ` : ""}${i.message}`)
        ),
      ],
    };
  };

  const switchMode = (next: Mode) => {
    if (next === mode) {
      return;
    }
    if (next === "yaml") {
      const draft = toDraft(getValues());
      const parsed = submissionSchema.safeParse(draft);
      // SAFETY: an incomplete draft is only turned into YAML text to edit, with the
      // required fields left blank; nothing is submitted from it.
      const text = parsed.success
        ? submissionToYaml(parsed.data)
        : submissionToYaml(draft as Submission, { draft: true });
      generatedYaml.current = text;
      setYamlText(text);
      setYamlErrors([]);
    } else {
      // Carry YAML edits back into the form when they parse. Untouched YAML
      // leaves the form as it was.
      if (yamlText === generatedYaml.current) {
        setMode(next);
        return;
      }
      try {
        // SAFETY: toValues only reads fields with defaults, so a partial or loosely typed
        // parse still produces complete form values.
        const candidate = yamlToSubmission(yamlText, knownOrganizations) as Partial<Submission>;
        reset(toValues(candidate), { keepSubmitCount: true });
      } catch {
        // Unparseable YAML: keep the form as it was.
      }
    }
    setMode(next);
  };

  const post = async (submission: Submission) => {
    try {
      const response = await fetch("/api/submit", {
        body: JSON.stringify(submission),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (response.ok) {
        setSubmitted(await response.json());
        return;
      }
      setProblem(problemFor(response.status));
      if (response.status === 400 && mode === "form") {
        // SAFETY: a 400 from /api/submit carries { issues } (zod issues); a body that
        // fails to parse becomes null and the optional fields are checked before use.
        const body = (await response.json().catch(() => null)) as {
          issues?: { path: PropertyKey[]; message: string }[];
        } | null;
        for (const issue of body?.issues ?? []) {
          // SAFETY: fieldFor maps submission paths onto the form's field names.
          form.setError(fieldFor(issue.path, getValues()) as keyof FormValues, {
            message: issue.message,
            type: "server",
          });
        }
      }
    } catch {
      setProblem({
        detail: "Check your connection and try again, or open it on GitHub.",
        title: "We couldn't reach the server",
      });
    }
  };

  const send = async (submission: Submission) => {
    setProblem(null);
    setSubmitting(true);
    await post(submission);
    setSubmitting(false);
  };

  const onSubmit = () => {
    if (mode === "yaml") {
      const result = parseYaml();
      setYamlErrors(result.errors);
      if (result.submission) {
        send(result.submission);
      }
      return;
    }
    handleSubmit(
      (v) => send(submissionSchema.parse(toDraft(v))),
      (invalid) => {
        const [first] = errorList(invalid);
        if (first) {
          focusField(first.name);
        }
      }
    )();
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-black/10 bg-white/60 px-6 py-10 text-center">
        <CheckCircle2Icon className="text-primary size-10" />
        <h2 className="type-section">Thank you!</h2>
        <p className="text-muted-foreground max-w-md text-sm">
          A maintainer will review the submission before it&apos;s published. You can follow along
          on GitHub.
        </p>
        <Link className="text-sm font-semibold underline" href={submitted.url} target="_blank">
          View the request
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-8"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-4">
        <p className="text-muted-foreground text-sm">
          {mode === "form"
            ? "Know the profile schema? Switch to YAML."
            : "Edit the profile YAML directly."}
        </p>
        <ToggleGroup
          aria-label="Input mode"
          className="shrink-0 rounded-md bg-black/5 p-0.5"
          // SAFETY: the only items are "form" and "yaml".
          onValueChange={(next) => next[0] && switchMode(next[0] as Mode)}
          spacing={0}
          value={[mode]}
        >
          {(["form", "yaml"] as const).map((value) => (
            <ToggleGroupItem
              className="text-muted-foreground aria-pressed:text-foreground rounded! px-4 aria-pressed:bg-white aria-pressed:font-semibold"
              key={value}
              value={value}
            >
              {value === "form" ? "Form" : "YAML"}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {mode === "form" && (
        <Controller
          control={control}
          name="kinds"
          render={({ field, fieldState }) => (
            <FieldSet data-invalid={fieldState.invalid || undefined}>
              <FieldLegend variant="label">
                They… <span className="text-muted-foreground font-normal">(pick one or both)</span>
              </FieldLegend>
              <div className="grid gap-2 sm:grid-cols-2">
                {KIND_OPTIONS.map(({ value, label, hint, Icon }, i) => {
                  const on = field.value.includes(value);
                  return (
                    <FieldLabel
                      className={cn(
                        "w-full! rounded-lg! transition-colors",
                        on
                          ? "border-secondary! bg-secondary! text-secondary-foreground"
                          : "bg-white/60 hover:border-black/40"
                      )}
                      key={value}
                    >
                      <Field orientation="horizontal">
                        <Icon className="size-5 shrink-0" />
                        <FieldContent className="gap-0.5">
                          <FieldTitle>{label}</FieldTitle>
                          <FieldDescription className={cn(on && "text-secondary-foreground/80")}>
                            {hint}
                          </FieldDescription>
                        </FieldContent>
                        <Checkbox
                          aria-invalid={fieldState.invalid || undefined}
                          checked={on}
                          className={cn(on && "text-secondary! border-white! bg-white!")}
                          id={i === 0 ? fieldId("kinds") : undefined}
                          onCheckedChange={(checked) =>
                            field.onChange(
                              checked
                                ? [...field.value, value]
                                : field.value.filter((k: Kind) => k !== value)
                            )
                          }
                        />
                      </Field>
                    </FieldLabel>
                  );
                })}
              </div>
              <FieldError errors={[fieldState.error]} />
            </FieldSet>
          )}
        />
      )}

      {mode === "form" && !hasKind && <PickKindHint />}

      {mode === "form" && hasKind && (
        <FieldGroup className="gap-6">
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={fieldId("name")}>Full name</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  autoComplete="off"
                  id={fieldId("name")}
                  placeholder={isContributor ? "Angeline Stoll Lillard" : "Yo-Yo Ma"}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {isContributor && (
            <Controller
              control={control}
              name="roles"
              render={({ field, fieldState }) => (
                <FieldSet data-invalid={fieldState.invalid || undefined}>
                  <FieldLegend variant="label">Role</FieldLegend>
                  <ToggleGroup
                    aria-invalid={fieldState.invalid || undefined}
                    className="w-full flex-wrap"
                    multiple
                    onValueChange={(next) => field.onChange(next)}
                    spacing={1}
                    value={field.value}
                  >
                    {CONTRIBUTOR_ROLES.map((role, i) => (
                      <ToggleGroupItem
                        className="aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground h-9 rounded-full border border-black/15 bg-white/60 px-3.5 font-normal hover:border-black/40"
                        id={i === 0 ? fieldId("roles") : undefined}
                        key={role}
                        value={role}
                      >
                        {CONTRIBUTOR_ROLE_LABELS[role]}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <FieldError errors={[fieldState.error]} />
                </FieldSet>
              )}
            />
          )}

          {isAlum && (
            <Controller
              control={control}
              name="schools"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={fieldId("schools")}>
                    Montessori school{" "}
                    <span className="text-muted-foreground font-normal">(if you know it)</span>
                  </FieldLabel>
                  <OrganizationPicker
                    id={fieldId("schools")}
                    invalid={fieldState.invalid}
                    onChange={(next) => field.onChange(next)}
                    options={organizations}
                    placeholder="Search schools, or type a new one…"
                    value={field.value}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          )}

          {isContributor && (
            <Controller
              control={control}
              name="affiliations"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={fieldId("affiliations")}>Affiliations</FieldLabel>
                  <OrganizationPicker
                    id={fieldId("affiliations")}
                    invalid={fieldState.invalid}
                    onChange={(next) => field.onChange(next)}
                    options={organizations}
                    placeholder="Search schools, universities, organizations, or type a new one…"
                    value={field.value}
                    withRole
                  />
                  {fieldState.error ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : (
                    <FieldDescription>
                      Pick an existing organization so profiles link together, or add a new one.
                    </FieldDescription>
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            control={control}
            name="tagline"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <div className="flex items-baseline justify-between gap-4">
                  <FieldLabel htmlFor={fieldId("tagline")}>Tagline</FieldLabel>
                  <span
                    className={cn(
                      "text-muted-foreground text-xs tabular-nums",
                      field.value.length > 100 && "text-destructive"
                    )}
                  >
                    {field.value.length} / 100
                  </span>
                </div>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  id={fieldId("tagline")}
                  placeholder={
                    isContributor
                      ? "Psychologist researching Montessori outcomes"
                      : "World-renowned cellist and winner of 19 Grammy Awards"
                  }
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="tags"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={fieldId("tags")}>Tags</FieldLabel>
                <TagInput
                  id={fieldId("tags")}
                  invalid={fieldState.invalid}
                  onChange={(next) => field.onChange(next)}
                  placeholder={isContributor ? "Researcher, Author" : "Musician, Cellist"}
                  suggestions={tagSuggestions}
                  value={field.value}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>Press Enter after each tag.</FieldDescription>
                )}
              </Field>
            )}
          />

          <FieldSet
            data-invalid={
              formState.errors.sourceUrl || formState.errors.sourceNote ? true : undefined
            }
          >
            <FieldLegend variant="label">{sourceQuestion(isContributor, isAlum)}</FieldLegend>
            <Controller
              control={control}
              name="sourceType"
              render={({ field }) => (
                <ToggleGroup
                  aria-label="Kind of source"
                  className="w-full flex-wrap"
                  onValueChange={(next) => next[0] && field.onChange(next[0])}
                  spacing={1}
                  value={[field.value]}
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <ToggleGroupItem
                      className="aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground h-9 rounded-full border border-black/15 bg-white/60 px-3.5 font-normal hover:border-black/40"
                      key={option.type}
                      value={option.type}
                    >
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
            />
            {isPersonal ? (
              <Controller
                control={control}
                name="sourceNote"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid || undefined}
                      aria-label="How do you know them?"
                      id={fieldId("sourceNote")}
                      placeholder="How do you know them? e.g. I was their classmate at …"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            ) : (
              <Controller
                control={control}
                name="sourceUrl"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid || undefined}
                      aria-label="Link to the source"
                      id={fieldId("sourceUrl")}
                      inputMode="url"
                      placeholder={source?.placeholder}
                      type="url"
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            )}
          </FieldSet>

          <div aria-hidden="true" className="flex items-center gap-3 pt-2">
            <span className="type-eyebrow">Optional</span>
            <span className="h-px flex-1 bg-black/10" />
          </div>

          <Controller
            control={control}
            name="bio"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <div className="flex items-baseline justify-between gap-4">
                  <FieldLabel htmlFor={fieldId("bio")}>Bio</FieldLabel>
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {field.value.length} / 1000
                  </span>
                </div>
                <Textarea
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  className="min-h-24"
                  id={fieldId("bio")}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={fieldId("notes")}>
                  {isContributor && !isAlum ? "Montessori notes" : "Education notes"}
                </FieldLabel>
                <Textarea
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  id={fieldId("notes")}
                  placeholder={
                    isContributor && !isAlum
                      ? "How they contribute to Montessori"
                      : "Where and when they attended Montessori"
                  }
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <Controller
            control={control}
            name="highlights"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={fieldId("highlights")}>
                  {isContributor ? "Notable contributions" : "Notable achievements"}
                </FieldLabel>
                <Textarea
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  id={fieldId("highlights")}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>One per line</FieldDescription>
                )}
              </Field>
            )}
          />

          <Controller
            control={control}
            name="quote"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor={fieldId("quote")}>Quote about their education</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid || undefined}
                  id={fieldId("quote")}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          <LinksFieldSet control={control} links={links} />

          <p className="text-muted-foreground text-sm">
            Have a photo? Attach it on GitHub after you submit, with who took it.
          </p>
        </FieldGroup>
      )}

      {mode === "yaml" && (
        <YamlField
          errors={yamlErrors}
          onTextChange={setYamlText}
          reference={yamlReference}
          text={yamlText}
        />
      )}

      {(mode === "yaml" || hasKind) && (
        <FormFooter
          errors={errors}
          githubUrl={githubUrl}
          problem={problem}
          showSummary={showSummary && mode === "form"}
          submitting={submitting}
        />
      )}
    </form>
  );
};
