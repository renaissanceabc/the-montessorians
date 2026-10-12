"use client";

import yaml from "js-yaml";
import {
  AlertCircleIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  GraduationCapIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Controller,
  type FieldErrors,
  type Resolver,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
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
  FieldSeparator,
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
import {
  CONTRIBUTOR_ROLE_LABELS,
  CONTRIBUTOR_ROLES,
  LINK_TYPES,
  type SourceType,
  type Tag,
} from "@/lib/content/types";
import {
  crossFieldIssues,
  githubSubmissionUrl,
  type Submission,
  submissionSchema,
  submissionToYaml,
  yamlToSubmission,
} from "@/lib/submission";
import { cn, toTitleCase } from "@/lib/utils";
import {
  type OrganizationOption,
  OrganizationPicker,
  type PickedOrganization,
} from "./organization-picker";
import { TagInput } from "./tag-input";

type Kind = Submission["kinds"][number];
type Mode = "form" | "yaml";
type LinkType = (typeof LINK_TYPES)[number];

type FormValues = {
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
};

const DEFAULT_VALUES: FormValues = {
  kinds: [],
  name: "",
  roles: [],
  schools: [],
  affiliations: [],
  tagline: "",
  tags: [],
  sourceType: "wikipedia",
  sourceUrl: "",
  sourceNote: "",
  bio: "",
  notes: "",
  highlights: "",
  quote: "",
  links: [{ type: "wikipedia", url: "" }],
};

const KIND_OPTIONS = [
  { value: "alum", label: "Attended Montessori", hint: "An alum", Icon: GraduationCapIcon },
  {
    value: "contributor",
    label: "Contributed to the field",
    hint: "Researcher, author, philosopher, founder…",
    Icon: BookOpenIcon,
  },
] as const;

const SOURCE_OPTIONS: { type: SourceType; label: string; placeholder: string }[] = [
  { type: "wikipedia", label: "Wikipedia", placeholder: "https://en.wikipedia.org/wiki/…" },
  { type: "article", label: "Article or interview", placeholder: "https://…" },
  { type: "social", label: "Social post", placeholder: "https://x.com/…" },
  { type: "publication", label: "Book or publication", placeholder: "DOI, ISBN page, or URL" },
  { type: "personal-knowledge", label: "Personal knowledge", placeholder: "" },
  { type: "other", label: "Other", placeholder: "https://…" },
];

const LINK_LABELS: Record<LinkType, string> = {
  wikipedia: "Wikipedia",
  website: "Website",
  linkedin: "LinkedIn",
  x: "X",
  tiktok: "TikTok",
  instagram: "Instagram",
  article: "Article",
  youtube: "YouTube",
  imdb: "IMDb",
};

const LINK_ITEMS = LINK_TYPES.map((type) => ({ value: type, label: LINK_LABELS[type] }));

/** Fields in page order, with the label used in the error summary. */
const FIELD_ORDER: { name: string; label: string }[] = [
  { name: "kinds", label: "They…" },
  { name: "name", label: "Full name" },
  { name: "roles", label: "Role" },
  { name: "schools", label: "Montessori school" },
  { name: "affiliations", label: "Affiliations" },
  { name: "tagline", label: "Tagline" },
  { name: "tags", label: "Tags" },
  { name: "sourceUrl", label: "Source" },
  { name: "sourceNote", label: "Source" },
  { name: "bio", label: "Bio" },
  { name: "notes", label: "Notes" },
  { name: "highlights", label: "Highlights" },
  { name: "quote", label: "Quote" },
  { name: "links", label: "Links" },
];

const fieldId = (name: string) => `contribute-${name.replace(/\./g, "-")}`;

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** The form's values as a submission (unvalidated). */
function toDraft(v: FormValues) {
  const isAlum = v.kinds.includes("alum");
  const isContributor = v.kinds.includes("contributor");
  const personal = v.sourceType === "personal-knowledge";
  return {
    kinds: v.kinds,
    name: v.name,
    tagline: v.tagline,
    tags: v.tags,
    roles: isContributor ? v.roles : undefined,
    schools: isAlum && v.schools.length ? v.schools : undefined,
    affiliations: isContributor && v.affiliations.length ? v.affiliations : undefined,
    sources: [
      personal
        ? { type: v.sourceType, note: v.sourceNote }
        : { type: v.sourceType, url: v.sourceUrl.trim() || undefined },
    ],
    bio: v.bio,
    education_notes: isAlum ? v.notes : undefined,
    montessori_notes: isContributor && !isAlum ? v.notes : undefined,
    notable_achievements: isContributor ? undefined : lines(v.highlights),
    contributions: isContributor
      ? lines(v.highlights).map((title) => ({ title, type: "other" }))
      : undefined,
    quotes: v.quote.trim() ? [v.quote.trim()] : undefined,
    links: v.links.filter((l) => l.url.trim()).map((l) => ({ type: l.type, url: l.url.trim() })),
  };
}

/** A parsed submission back into form values (for YAML → form). */
function toValues(s: Partial<Submission>): FormValues {
  const source = s.sources?.[0];
  return {
    ...DEFAULT_VALUES,
    kinds: s.kinds ?? [],
    name: s.name ?? "",
    roles: s.roles ?? [],
    schools: s.schools ?? [],
    affiliations: s.affiliations ?? [],
    tagline: s.tagline ?? "",
    tags: (s.tags ?? []).map((t) => toTitleCase(t.replace(/-/g, " "))),
    sourceType: (source?.type as SourceType) ?? "wikipedia",
    sourceUrl: source?.url ?? "",
    sourceNote: source?.note ?? "",
    bio: s.bio ?? "",
    notes: s.education_notes ?? s.montessori_notes ?? "",
    highlights: (s.notable_achievements ?? s.contributions?.map((c) => c.title) ?? []).join("\n"),
    quote: s.quotes?.[0] ?? "",
    links: s.links?.length ? (s.links as FormValues["links"]) : DEFAULT_VALUES.links,
  };
}

/** Which form field a submission issue belongs to. */
function fieldFor(path: PropertyKey[], v: FormValues): string {
  const [head, index] = path;
  switch (head) {
    case "sources":
      return v.sourceType === "personal-knowledge" ? "sourceNote" : "sourceUrl";
    case "education_notes":
    case "montessori_notes":
      return "notes";
    case "notable_achievements":
    case "contributions":
      return "highlights";
    case "quotes":
      return "quote";
    case "links": {
      // Empty rows are dropped from the draft, so map back to the row on screen.
      const rows = v.links.flatMap((l, i) => (l.url.trim() ? [i] : []));
      return typeof index === "number" && rows[index] !== undefined
        ? `links.${rows[index]}.url`
        : "links";
    }
    default:
      return String(head ?? "root");
  }
}

function setError(errors: Record<string, unknown>, name: string, message: string) {
  const parts = name.split(".");
  let node = errors as Record<string, unknown>;
  for (const [i, part] of parts.entries()) {
    if (i === parts.length - 1) {
      node[part] ??= { type: "validation", message };
    } else {
      node[part] ??= /^\d+$/.test(parts[i + 1]) ? [] : {};
      node = node[part] as Record<string, unknown>;
    }
  }
}

function issuesFor(draft: ReturnType<typeof toDraft>) {
  const parsed = submissionSchema.safeParse(draft);
  if (parsed.success) {
    return [];
  }
  // Zod skips the cross-field checks while other fields fail; run them anyway.
  return [
    ...parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
    ...crossFieldIssues(draft),
  ];
}

const resolver: Resolver<FormValues> = (values) => {
  const issues = issuesFor(toDraft(values));
  if (!issues.length) {
    return { values, errors: {} };
  }
  const errors: Record<string, unknown> = {};
  for (const issue of issues) {
    setError(errors, fieldFor(issue.path, values), issue.message);
  }
  return { values: {}, errors: errors as FieldErrors<FormValues> };
};

/** Flatten nested errors into [name, message] pairs in page order. */
function errorList(errors: FieldErrors<FormValues>) {
  const out: { name: string; label: string; message: string }[] = [];
  for (const { name, label } of FIELD_ORDER) {
    const error = errors[name as keyof FormValues];
    if (!error) {
      continue;
    }
    if (name === "links" && Array.isArray(error)) {
      error.forEach((row, i) => {
        if (row?.url?.message) {
          out.push({ name: `links.${i}.url`, label: `Link ${i + 1}`, message: row.url.message });
        }
      });
    } else if ("message" in error && error.message) {
      out.push({ name, label, message: String(error.message) });
    }
  }
  return out;
}

function focusField(name: string) {
  const el = document.getElementById(fieldId(name));
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  el?.focus({ preventScroll: true });
}

type ServerProblem = { title: string; detail: string };

function problemFor(status: number): ServerProblem {
  switch (status) {
    case 400:
      return {
        title: "Some details need another look",
        detail: "The fields marked below didn't pass our checks.",
      };
    case 403:
      return {
        title: "We couldn't accept this from your browser",
        detail: "It was flagged as automated. Open it on GitHub instead; everything is filled in.",
      };
    case 429:
      return {
        title: "Too many submissions",
        detail: "Please wait a few minutes and try again, or open it on GitHub.",
      };
    case 503:
      return {
        title: "Direct submissions aren't switched on yet",
        detail: "Open it on GitHub instead; everything you entered is filled in.",
      };
    default:
      return {
        title: "Something went wrong on our side",
        detail: `The request failed (error ${status}). Try again, or open it on GitHub.`,
      };
  }
}

export function ContributeForm({
  organizations,
  tagSuggestions,
}: {
  organizations: OrganizationOption[];
  tagSuggestions: Tag[];
}) {
  const knownOrganizations = new Map(organizations.map((o) => [o.slug, o.name]));
  const form = useForm<FormValues>({
    defaultValues: DEFAULT_VALUES,
    resolver,
    mode: "onSubmit",
    reValidateMode: "onChange",
    shouldFocusError: false,
  });
  const { control, handleSubmit, formState, reset, getValues } = form;
  const links = useFieldArray({ control, name: "links" });
  const values = useWatch({ control }) as FormValues;

  const [mode, setMode] = useState<Mode>("form");
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

  const githubUrl = githubSubmissionUrl(
    toDraft(getValues()) as Partial<Submission> & { kinds: Kind[] }
  );

  const parseYaml = (): { submission?: Submission; errors: string[] } => {
    let candidate: unknown;
    try {
      candidate = yamlToSubmission(yamlText, knownOrganizations);
    } catch (error) {
      const e = error as { reason?: string; mark?: { line: number }; message?: string };
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
      return { submission: parsed.data, errors: [] };
    }
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
      setYamlText(
        submissionToYaml(
          parsed.success
            ? parsed.data
            : ({
                ...draft,
                kinds: draft.kinds.length ? draft.kinds : ["alum"],
                name: draft.name || "Full Name",
                tagline: draft.tagline || "A short tagline",
                tags: draft.tags.length ? draft.tags : ["Tag"],
              } as Submission)
        )
      );
      setYamlErrors([]);
    } else {
      // Carry YAML edits back into the form when they parse.
      try {
        const candidate = yamlToSubmission(yamlText, knownOrganizations) as Partial<Submission>;
        reset(toValues(candidate), { keepSubmitCount: true });
      } catch {
        // Unparseable YAML: keep the form as it was.
      }
    }
    setMode(next);
  };

  const send = async (submission: Submission) => {
    setProblem(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });
      if (response.ok) {
        setSubmitted(await response.json());
        return;
      }
      setProblem(problemFor(response.status));
      if (response.status === 400 && mode === "form") {
        const body = (await response.json().catch(() => null)) as {
          issues?: { path: PropertyKey[]; message: string }[];
        } | null;
        for (const issue of body?.issues ?? []) {
          form.setError(fieldFor(issue.path, getValues()) as keyof FormValues, {
            type: "server",
            message: issue.message,
          });
        }
      }
    } catch {
      setProblem({
        title: "We couldn't reach the server",
        detail: "Check your connection and try again, or open it on GitHub.",
      });
    } finally {
      setSubmitting(false);
    }
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
        const first = errorList(invalid)[0];
        if (first) {
          focusField(first.name);
        }
      }
    )();
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-black/10 bg-white/60 px-6 py-10 text-center">
        <CheckCircle2Icon className="size-10 text-primary" />
        <h2 className="font-semibold font-serif text-3xl">Thank you!</h2>
        <p className="max-w-md text-muted-foreground text-sm">
          A maintainer will review the submission before it's published. You can follow along on
          GitHub.
        </p>
        <Link className="font-semibold text-sm underline" href={submitted.url} target="_blank">
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
      <div className="flex items-center justify-between gap-4 border-black/10 border-b pb-4">
        <p className="text-muted-foreground text-sm">
          {mode === "form"
            ? "Know the profile schema? Switch to YAML."
            : "Edit the profile YAML directly."}
        </p>
        <ToggleGroup
          aria-label="Input mode"
          className="shrink-0 rounded-md bg-black/5 p-0.5"
          onValueChange={(next) => next[0] && switchMode(next[0] as Mode)}
          spacing={0}
          value={[mode]}
        >
          {(["form", "yaml"] as const).map((value) => (
            <ToggleGroupItem
              className="rounded! px-4 text-muted-foreground aria-pressed:bg-white aria-pressed:font-semibold aria-pressed:text-foreground"
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
                They… <span className="font-normal text-muted-foreground">(pick one or both)</span>
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
                          <FieldDescription
                            className={cn("text-xs", on && "text-secondary-foreground/80")}
                          >
                            {hint}
                          </FieldDescription>
                        </FieldContent>
                        <Checkbox
                          aria-invalid={fieldState.invalid || undefined}
                          checked={on}
                          className={cn(on && "border-white! bg-white! text-secondary!")}
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

      {mode === "form" && !hasKind ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-black/15 border-dashed px-6 py-10 text-center text-muted-foreground text-sm">
          <AlertCircleIcon className="size-5" />
          <p className="max-w-sm text-balance">
            Pick one or both above to start. We'll show the fields that fit: their Montessori school
            for alumni, or roles, affiliations, and published work for contributors.
          </p>
        </div>
      ) : mode === "form" ? (
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
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>The page address is made from the name</FieldDescription>
                )}
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
                    onValueChange={field.onChange}
                    spacing={1}
                    value={field.value}
                  >
                    {CONTRIBUTOR_ROLES.map((role, i) => (
                      <ToggleGroupItem
                        className="h-9 rounded-full border border-black/15 bg-white/60 px-3.5 font-normal hover:border-black/40 aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
                        id={i === 0 ? fieldId("roles") : undefined}
                        key={role}
                        value={role}
                      >
                        {CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS]}
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
                    <span className="font-normal text-muted-foreground">(if you know it)</span>
                  </FieldLabel>
                  <OrganizationPicker
                    id={fieldId("schools")}
                    invalid={fieldState.invalid}
                    onChange={field.onChange}
                    options={organizations}
                    placeholder="Search schools, or type a new one"
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
                    onChange={field.onChange}
                    options={organizations}
                    placeholder="Search schools, universities, organizations, or type a new one"
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
                  onChange={field.onChange}
                  placeholder={isContributor ? "Researcher, Author" : "Musician, Cellist"}
                  suggestions={tagSuggestions}
                  value={field.value}
                />
                {fieldState.error ? (
                  <FieldError errors={[fieldState.error]} />
                ) : (
                  <FieldDescription>
                    Press Enter after each tag. Existing tags are suggested first; the first three
                    show on their card.
                  </FieldDescription>
                )}
              </Field>
            )}
          />

          <FieldSet
            data-invalid={
              formState.errors.sourceUrl || formState.errors.sourceNote ? true : undefined
            }
          >
            <FieldLegend variant="label">
              {isContributor
                ? "Where is their contribution documented?"
                : isAlum
                  ? "How do we know they attended Montessori?"
                  : "How do we know about them?"}
            </FieldLegend>
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
                      className="h-9 rounded-full border border-black/15 bg-white/60 px-3.5 font-normal hover:border-black/40 aria-pressed:border-secondary aria-pressed:bg-secondary aria-pressed:text-secondary-foreground"
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

          <FieldSeparator className="my-1 [&_[data-slot=field-separator-content]]:bg-background [&_[data-slot=field-separator-content]]:font-semibold [&_[data-slot=field-separator-content]]:text-xs [&_[data-slot=field-separator-content]]:uppercase [&_[data-slot=field-separator-content]]:tracking-widest">
            Optional
          </FieldSeparator>

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
                              items={LINK_ITEMS}
                              onValueChange={(next) => next && typeField.onChange(next)}
                              value={typeField.value}
                            >
                              <SelectTrigger
                                aria-label="Link type"
                                className="w-28 shrink-0 sm:w-36"
                              >
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {LINK_ITEMS.map((item) => (
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
            <Button
              className="self-start"
              onClick={() => links.append({ type: "website", url: "" })}
              size="sm"
              type="button"
              variant="ghost"
            >
              <PlusIcon />
              Add another link
            </Button>
          </FieldSet>

          <p className="text-muted-foreground text-sm">
            Have a photo? Attach it on GitHub after you submit, with who took it.
          </p>
        </FieldGroup>
      ) : (
        <Field data-invalid={yamlErrors.length > 0 || undefined}>
          <FieldLabel htmlFor={fieldId("yaml")}>Profile YAML</FieldLabel>
          <Textarea
            aria-invalid={yamlErrors.length > 0 || undefined}
            className="min-h-96 font-mono text-xs leading-relaxed"
            id={fieldId("yaml")}
            onChange={(e) => setYamlText(e.target.value)}
            spellCheck={false}
            value={yamlText}
          />
          {yamlErrors.length ? (
            <FieldError errors={yamlErrors.map((message) => ({ message }))} />
          ) : (
            <FieldDescription>
              Checked against the profile schema before it's sent. Switch back to Form to keep
              editing with these values.
            </FieldDescription>
          )}
        </Field>
      )}

      {(mode === "yaml" || hasKind) && (
        <div className="flex flex-col gap-4 border-black/10 border-t pt-6">
          {showSummary && mode === "form" && (
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
                <Link className="font-medium underline" href={githubUrl} target="_blank">
                  Open it on GitHub
                </Link>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button className="w-full sm:w-auto" disabled={submitting} size="lg" type="submit">
              {submitting ? "Submitting…" : "Submit for review"}
            </Button>
            <Link
              className="text-center text-muted-foreground text-sm hover:underline sm:text-left"
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
      )}
    </form>
  );
}
