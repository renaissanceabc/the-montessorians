"use client";

import { CheckCircle2Icon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CONTRIBUTOR_ROLE_LABELS,
  CONTRIBUTOR_ROLES,
  LINK_TYPES,
  type SourceType,
} from "@/lib/content/types";
import {
  githubSubmissionUrl,
  type Submission,
  submissionSchema,
  submissionToYaml,
  yamlToSubmission,
} from "@/lib/submission";
import { cn } from "@/lib/utils";

type Kind = Submission["kind"];
type Mode = "form" | "yaml";
type LinkType = (typeof LINK_TYPES)[number];

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

const fieldClass =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

const chipClass = (on: boolean) =>
  cn(
    "min-h-9 cursor-pointer rounded-full border px-3.5 text-sm transition-colors",
    on
      ? "border-secondary bg-secondary text-secondary-foreground"
      : "border-black/15 bg-white/60 hover:border-black/40"
  );

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function Field({
  label,
  hint,
  error,
  children,
  counter,
}: {
  label: string;
  hint?: string;
  error?: string;
  counter?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 font-semibold text-sm">
      <span className="flex justify-between gap-4">
        {label}
        {counter && <span className="font-normal text-muted-foreground text-xs">{counter}</span>}
      </span>
      {children}
      {hint && !error && <span className="font-normal text-muted-foreground text-xs">{hint}</span>}
      {error && <span className="font-normal text-destructive text-xs">{error}</span>}
    </label>
  );
}

export function ContributeForm() {
  const [kind, setKind] = useState<Kind>("alum");
  const [mode, setMode] = useState<Mode>("form");

  const [name, setName] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [tagline, setTagline] = useState("");
  const [tags, setTags] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("wikipedia");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [bio, setBio] = useState("");
  const [notes, setNotes] = useState("");
  const [highlights, setHighlights] = useState("");
  const [quote, setQuote] = useState("");
  const [links, setLinks] = useState<{ type: LinkType; url: string }[]>([
    { type: "wikipedia", url: "" },
  ]);
  const [yamlText, setYamlText] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [submitted, setSubmitted] = useState<{ url: string } | null>(null);

  const isContributor = kind === "contributor";
  const isPersonal = sourceType === "personal-knowledge";
  const source = SOURCE_OPTIONS.find((s) => s.type === sourceType);

  // The form state as a submission draft (unvalidated).
  const draft = useMemo(
    () => ({
      kind,
      name,
      tagline,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      roles: isContributor ? roles : undefined,
      sources: [
        isPersonal
          ? { type: sourceType, note: sourceNote }
          : { type: sourceType, url: sourceUrl.trim() || undefined },
      ],
      bio,
      education_notes: isContributor ? undefined : notes,
      montessori_notes: isContributor ? notes : undefined,
      notable_achievements: isContributor ? undefined : lines(highlights),
      contributions: isContributor
        ? lines(highlights).map((title) => ({ title, type: "other" }))
        : undefined,
      quotes: quote.trim() ? [quote.trim()] : undefined,
      links: links.filter((l) => l.url.trim()).map((l) => ({ type: l.type, url: l.url.trim() })),
    }),
    [
      kind,
      name,
      tagline,
      tags,
      roles,
      isContributor,
      isPersonal,
      sourceType,
      sourceNote,
      sourceUrl,
      bio,
      notes,
      highlights,
      quote,
      links,
    ]
  );

  const switchMode = (next: Mode) => {
    if (next === "yaml" && !yamlText) {
      const parsed = submissionSchema.safeParse(draft);
      setYamlText(
        parsed.success
          ? submissionToYaml(parsed.data)
          : submissionToYaml({
              ...(draft as Submission),
              name: name || (isContributor ? "Angeline Stoll Lillard" : "Yo-Yo Ma"),
              tagline: tagline || "A short tagline",
              tags: draft.tags.length ? draft.tags : ["tag"],
            })
      );
    }
    setMode(next);
  };

  const submit = async () => {
    const candidate = mode === "yaml" ? yamlToSubmission(yamlText) : draft;
    const parsed = submissionSchema.safeParse(candidate);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setStatus("submitting");
    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!response.ok) {
        throw new Error(String(response.status));
      }
      setSubmitted(await response.json());
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const githubUrl = githubSubmissionUrl(draft as Partial<Submission> & { kind: Kind });

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-black/10 bg-white/60 p-10 text-center">
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
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 font-semibold text-sm">They…</legend>
          <div className="flex flex-wrap gap-1">
            {(
              [
                ["alum", "Attended Montessori"],
                ["contributor", "Contributed to the field"],
              ] as const
            ).map(([value, label]) => (
              <button
                aria-pressed={kind === value}
                className={cn(chipClass(kind === value), "min-h-11 rounded-md px-4")}
                key={value}
                onClick={() => setKind(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div
          aria-label="Input mode"
          className="flex gap-0.5 rounded-md bg-black/5 p-0.5"
          role="group"
        >
          {(["form", "yaml"] as const).map((value) => (
            <button
              aria-pressed={mode === value}
              className={cn(
                "min-h-9 rounded px-4 text-sm",
                mode === value ? "bg-white font-semibold" : "text-muted-foreground"
              )}
              key={value}
              onClick={() => switchMode(value)}
              type="button"
            >
              {value === "form" ? "Form" : "YAML"}
            </button>
          ))}
        </div>
      </div>

      {mode === "form" ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              error={errors.name}
              hint="The page address is made from the name"
              label="Full name"
            >
              <Input
                className={fieldClass}
                onChange={(e) => setName(e.target.value)}
                placeholder={isContributor ? "Angeline Stoll Lillard" : "Yo-Yo Ma"}
                value={name}
              />
            </Field>
          </div>

          {isContributor && (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-semibold text-sm">Role</legend>
              <div className="flex flex-wrap gap-1">
                {CONTRIBUTOR_ROLES.map((role) => (
                  <button
                    aria-pressed={roles.includes(role)}
                    className={chipClass(roles.includes(role))}
                    key={role}
                    onClick={() =>
                      setRoles((r) =>
                        r.includes(role) ? r.filter((x) => x !== role) : [...r, role]
                      )
                    }
                    type="button"
                  >
                    {CONTRIBUTOR_ROLE_LABELS[role as keyof typeof CONTRIBUTOR_ROLE_LABELS]}
                  </button>
                ))}
              </div>
              {errors.roles && <span className="text-destructive text-xs">{errors.roles}</span>}
            </fieldset>
          )}

          <Field counter={`${tagline.length} / 100`} error={errors.tagline} label="Tagline">
            <Input
              className={fieldClass}
              maxLength={100}
              onChange={(e) => setTagline(e.target.value)}
              placeholder={
                isContributor
                  ? "Psychologist researching Montessori outcomes"
                  : "World-renowned cellist and winner of 19 Grammy Awards"
              }
              value={tagline}
            />
          </Field>

          <Field
            error={errors.tags}
            hint="Comma separated. The first three show on their card."
            label="Tags"
          >
            <Input
              className={fieldClass}
              onChange={(e) => setTags(e.target.value)}
              placeholder={isContributor ? "researcher, author" : "musician, cellist, performer"}
              value={tags}
            />
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold text-sm">
              {isContributor
                ? "Where is their contribution documented?"
                : "How do we know they attended Montessori?"}
            </legend>
            <div className="flex flex-wrap gap-1">
              {SOURCE_OPTIONS.map((option) => (
                <button
                  aria-pressed={sourceType === option.type}
                  className={chipClass(sourceType === option.type)}
                  key={option.type}
                  onClick={() => setSourceType(option.type)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
            {isPersonal ? (
              <Input
                aria-label="How do you know them?"
                className={cn(fieldClass, "mt-1")}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="How do you know them? e.g. I was their classmate at …"
                value={sourceNote}
              />
            ) : (
              <Input
                aria-label="Link to the source"
                className={cn(fieldClass, "mt-1")}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={source?.placeholder}
                type="url"
                value={sourceUrl}
              />
            )}
            {errors.sources && <span className="text-destructive text-xs">{errors.sources}</span>}
          </fieldset>

          <div className="flex items-center gap-3 pt-2">
            <span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
              Optional
            </span>
            <span className="flex-1 border-black/10 border-t" />
          </div>

          <Field counter={`${bio.length} / 1000`} error={errors.bio} label="Bio">
            <textarea
              className={fieldClass}
              maxLength={1000}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              value={bio}
            />
          </Field>

          <Field label={isContributor ? "Montessori notes" : "Education notes"}>
            <textarea
              className={fieldClass}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isContributor
                  ? "How they contribute to Montessori"
                  : "Where and when they attended Montessori"
              }
              rows={3}
              value={notes}
            />
          </Field>

          <Field
            hint="One per line"
            label={isContributor ? "Notable contributions" : "Notable achievements"}
          >
            <textarea
              className={fieldClass}
              onChange={(e) => setHighlights(e.target.value)}
              rows={3}
              value={highlights}
            />
          </Field>

          <Field label="Quote about their education">
            <Input
              className={fieldClass}
              onChange={(e) => setQuote(e.target.value)}
              value={quote}
            />
          </Field>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-semibold text-sm">Links</legend>
            {links.map((link, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: rows have no stable id
              <div className="flex gap-2" key={i}>
                <select
                  aria-label="Link type"
                  className={cn(fieldClass, "w-36")}
                  onChange={(e) =>
                    setLinks((ls) =>
                      ls.map((l, j) => (j === i ? { ...l, type: e.target.value as LinkType } : l))
                    )
                  }
                  value={link.type}
                >
                  {LINK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {LINK_LABELS[type]}
                    </option>
                  ))}
                </select>
                <Input
                  aria-label="Link URL"
                  className={fieldClass}
                  onChange={(e) =>
                    setLinks((ls) =>
                      ls.map((l, j) => (j === i ? { ...l, url: e.target.value } : l))
                    )
                  }
                  placeholder="https://…"
                  type="url"
                  value={link.url}
                />
              </div>
            ))}
            <button
              className="self-start py-1 font-semibold text-sm hover:underline"
              onClick={() => setLinks((ls) => [...ls, { type: "website", url: "" }])}
              type="button"
            >
              + Add another link
            </button>
            {errors.links && <span className="text-destructive text-xs">{errors.links}</span>}
          </fieldset>

          <p className="text-muted-foreground text-sm">
            Have a photo? Attach it on GitHub after you submit, with who took it.
          </p>
        </div>
      ) : (
        <Field
          error={Object.values(errors)[0]}
          hint="Checked against the profile schema before it's sent."
          label="Profile YAML"
        >
          <textarea
            className={cn(fieldClass, "font-mono text-xs leading-relaxed")}
            onChange={(e) => setYamlText(e.target.value)}
            rows={24}
            spellCheck={false}
            value={yamlText}
          />
        </Field>
      )}

      <div className="flex flex-col gap-3 border-black/10 border-t pt-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled={status === "submitting"} onClick={submit} size="lg">
            {status === "submitting" ? "Submitting…" : "Submit for review"}
          </Button>
          <Link
            className="text-muted-foreground text-sm hover:underline"
            href={githubUrl}
            target="_blank"
          >
            or open it as a GitHub issue
          </Link>
        </div>
        {status === "error" && (
          <p className="text-destructive text-sm">
            Something went wrong sending that.{" "}
            <Link className="underline" href={githubUrl} target="_blank">
              Open it on GitHub instead
            </Link>
            .
          </p>
        )}
        <p className="text-muted-foreground text-xs">
          Nothing is published until a maintainer reviews it.
        </p>
      </div>
    </div>
  );
}
