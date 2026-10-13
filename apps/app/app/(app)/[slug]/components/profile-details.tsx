"use client";

import {
  ArrowUpRightIcon,
  BookIcon,
  Building2Icon,
  FileTextIcon,
  GlobeIcon,
  GraduationCapIcon,
  InfoIcon,
  LandmarkIcon,
  LinkIcon,
  MessageCircleIcon,
  MicIcon,
  NewspaperIcon,
  PresentationIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import type { ReactNode } from "react";

import { OrgLogo } from "@/components/org-logo";
import { ProfilePhoto } from "@/components/profile-photo";
import { CorrectionButton, RecordDetails } from "@/components/record-rail";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HowWeVerify } from "@/components/verification";
import { LINK_LABELS } from "@/lib/content/types";
import type {
  Contribution,
  OrganizationRef,
  Profile,
  RelatedPerson,
  Source,
} from "@/lib/content/types";
import { cn, prettyUrl, toTitleCase } from "@/lib/utils";

/** Contributions shown before "Show all". */
const CONTRIBUTIONS_PREVIEW = 3;
/** How many newly revealed contributions stagger in; the rest arrive together. */
const REVEAL_STAGGER_ROWS = 8;
const REVEAL_STAGGER_MS = 30;
/** Co-authors named before "and N others". */
const COAUTHORS_SHOWN = 2;

export interface IdentifierLink {
  label: string;
  value: string;
  url: string;
}
export type ContributionLink = Contribution & { href: string | null; host: string | null };

const RELATION_LABELS: Record<RelatedPerson["relation"], string> = {
  advisee: "Advised",
  advisor: "Doctoral advisor",
  child: "Child",
  coauthor: "Co-author",
  colleague: "Colleague",
  parent: "Parent",
  sibling: "Sibling",
  spouse: "Spouse",
  trained: "Trained",
  trained_by: "Trained under",
};

const SOURCE_LABELS: Record<Source["type"], string> = {
  article: "Article",
  authority: "Library record",
  other: "Source",
  "personal-knowledge": "Personal knowledge",
  publication: "Publication",
  social: "Post",
  wikipedia: "Wikipedia",
};

const SOURCE_ICONS: Record<Source["type"], typeof GlobeIcon> = {
  article: NewspaperIcon,
  authority: LandmarkIcon,
  other: LinkIcon,
  "personal-knowledge": UsersIcon,
  publication: FileTextIcon,
  social: MessageCircleIcon,
  wikipedia: GlobeIcon,
};

const CONTRIBUTION_ICONS: Record<Contribution["type"], typeof BookIcon> = {
  article: FileTextIcon,
  book: BookIcon,
  chapter: FileTextIcon,
  lecture: MicIcon,
  media: MicIcon,
  other: FileTextIcon,
  "training-program": PresentationIcon,
};

const yearRange = (from?: number, to?: number) => {
  if (from && to) {
    return from === to ? `${from}` : `${from} – ${to}`;
  }
  if (from) {
    return `${from} – present`;
  }
  if (to) {
    return `until ${to}`;
  }
  return "";
};

/** "with Nicole Else-Quest" / "with Heise, Richey, and 3 others", leaving out the person themselves. */
const coauthorLine = (authors: string[] | undefined, name: string): string | null => {
  const surname = name.split(" ").at(-1)?.toLowerCase();
  const others = (authors ?? []).filter((a) => a.split(" ").at(-1)?.toLowerCase() !== surname);
  if (others.length === 0) {
    return null;
  }
  if (others.length <= COAUTHORS_SHOWN) {
    return `with ${others.join(" and ")}`;
  }
  const rest = others.length - COAUTHORS_SHOWN;
  return `with ${others.slice(0, COAUTHORS_SHOWN).join(", ")}, and ${rest} other${rest === 1 ? "" : "s"}`;
};

export const Section = ({
  title,
  count,
  info,
  aside,
  id,
  className,
  children,
}: {
  title: string;
  count?: number;
  info?: ReactNode;
  aside?: ReactNode;
  id?: string;
  className?: string;
  children: ReactNode;
}) => (
  <section className={cn("flex w-full min-w-0 scroll-mt-28 flex-col gap-2.5", className)} id={id}>
    <div className="flex min-h-6 items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="type-eyebrow">
          {title}
          {count !== undefined && <span className="font-normal"> · {count}</span>}
        </h2>
        {info}
      </div>
      {aside}
    </div>
    {children}
  </section>
);

const OrganizationCard = ({ refItem, school }: { refItem: OrganizationRef; school?: boolean }) => {
  const Icon = school ? GraduationCapIcon : Building2Icon;
  const range = yearRange(refItem.from, refItem.to);
  const detail = [refItem.role, refItem.level && toTitleCase(refItem.level)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      className="flex min-w-0 items-center gap-3.5 rounded-lg border border-black/10 bg-white/55 px-3.5 py-3 transition-colors hover:border-black/25 hover:bg-white"
      href={`/organizations/${refItem.organization}`}
    >
      <OrgLogo className="size-9" icon={Icon} logoUrl={refItem.organizationLogoUrl} size={36} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold [overflow-wrap:anywhere]">
          {refItem.organizationName ?? refItem.organization}
          {refItem.organizationShortName && (
            <span className="text-muted-foreground font-normal">
              {" "}
              ({refItem.organizationShortName})
            </span>
          )}
        </span>
        {detail && <span className="text-muted-foreground text-sm">{detail}</span>}
      </span>
      {range && (
        <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{range}</span>
      )}
    </Link>
  );
};

/** Contributions, with the first few shown until "Show all" is pressed. */
const ContributionsSection = ({
  contributions,
  name,
}: {
  contributions: ContributionLink[];
  name: string;
}) => {
  const listId = useId();
  const [showAllContributions, setShowAllContributions] = useState(false);
  if (contributions.length === 0) {
    return null;
  }
  const visibleContributions = showAllContributions
    ? contributions
    : contributions.slice(0, CONTRIBUTIONS_PREVIEW);

  return (
    <Section count={contributions.length} id="contributions" title="Contributions">
      <ul className="flex flex-col" id={listId}>
        {visibleContributions.map((c, i) => {
          const Icon = CONTRIBUTION_ICONS[c.type] ?? FileTextIcon;
          const withLine = coauthorLine(c.authors, name);
          const body = (
            <>
              <Icon
                aria-label={toTitleCase(c.type)}
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium [overflow-wrap:anywhere]">
                  <span
                    className={
                      c.href
                        ? "underline decoration-black/25 underline-offset-[3px] group-hover:decoration-current"
                        : ""
                    }
                  >
                    {c.title}
                  </span>
                  {c.href && (
                    <ArrowUpRightIcon
                      aria-hidden="true"
                      className="text-muted-foreground ml-1.5 inline size-3"
                    />
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {[c.venue, c.host].filter(Boolean).join(" · ")}
                </span>
                {withLine && (
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#4A433D]">
                    <UsersIcon aria-hidden="true" className="size-3 shrink-0" />
                    <span>{withLine}</span>
                  </span>
                )}
              </span>
              {c.year && (
                <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                  {c.year}
                </span>
              )}
            </>
          );
          return (
            <li
              className={cn(
                "border-b border-black/7",
                // Only rows revealed by "Show all" mount later, so only they ease in.
                i >= CONTRIBUTIONS_PREVIEW &&
                  "transition-[opacity,translate] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] starting:translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
              )}
              key={`${c.title}-${c.year ?? ""}`}
              style={
                i >= CONTRIBUTIONS_PREVIEW && i < CONTRIBUTIONS_PREVIEW + REVEAL_STAGGER_ROWS
                  ? { transitionDelay: `${(i - CONTRIBUTIONS_PREVIEW) * REVEAL_STAGGER_MS}ms` }
                  : undefined
              }
            >
              {c.href ? (
                <Link
                  className="group flex items-start gap-2.5 py-2.5"
                  href={c.href}
                  rel="noopener"
                  target="_blank"
                >
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-2.5 py-2.5">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {contributions.length > CONTRIBUTIONS_PREVIEW && (
        <button
          aria-controls={listId}
          aria-expanded={showAllContributions}
          className="self-start py-1.5 text-sm font-semibold hover:underline"
          data-print-hidden
          onClick={() => setShowAllContributions((v) => !v)}
          type="button"
        >
          {showAllContributions ? "Show fewer" : `Show all ${contributions.length}`}
        </button>
      )}
    </Section>
  );
};

/** Which main-column sections a profile has, and whether it has none of them. */
const profileSections = (profile: Profile, contributionCount: number) => {
  const isAlum = profile.kinds.includes("alum");
  const isContributor = profile.kinds.includes("contributor");
  const hasEducation = isAlum && (profile.schools.length > 0 || Boolean(profile.educationNotes));
  const hasAffiliations =
    profile.affiliations.length > 0 || (isContributor && Boolean(profile.montessoriNotes));
  const hasLists =
    contributionCount > 0 || profile.notableAchievements.length > 0 || profile.quotes.length > 0;
  const isSparse =
    !profile.bio && profile.tags.length === 0 && !hasEducation && !hasAffiliations && !hasLists;
  return { hasAffiliations, hasEducation, isContributor, isSparse };
};

const BioAndTags = ({ profile }: { profile: Profile }) => {
  if (!profile.bio && profile.tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      {profile.bio && <p className="type-body">{profile.bio}</p>}
      {profile.tags.length > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
          {profile.tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                className="inline-flex rounded-full bg-black/5 px-2.5 py-1 text-[13px] text-[#4A433D] transition-colors hover:bg-black/8"
                href={`/tags/${tag.slug}`}
              >
                {tag.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/**
 * The main column of a profile: bio and tags, Montessori education,
 * affiliations, contributions, achievements, and quotes.
 */
export const ProfileMain = ({
  profile,
  contributions,
  correctionUrl,
}: {
  profile: Profile;
  contributions: ContributionLink[];
  correctionUrl: string;
}) => {
  const { hasEducation, hasAffiliations, isContributor, isSparse } = profileSections(
    profile,
    contributions.length
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-9">
      <BioAndTags profile={profile} />

      {isSparse && (
        <div
          className="flex flex-col gap-1.5 rounded-xl border border-dashed border-black/20 p-5 text-sm"
          data-print-hidden
        >
          <p className="font-medium">This profile is just getting started.</p>
          <p className="text-muted-foreground">
            Know more about {profile.name}?{" "}
            <Link className="text-foreground underline" href={correctionUrl} target="_blank">
              Suggest an addition
            </Link>{" "}
            with a source.
          </p>
        </div>
      )}

      {hasEducation && (
        <Section title="Montessori education">
          {profile.schools.map((school) => (
            <OrganizationCard
              key={`${school.organization}-${school.from ?? ""}`}
              refItem={school}
              school
            />
          ))}
          {profile.educationNotes && (
            <p className="text-sm text-[#4A433D]">{profile.educationNotes}</p>
          )}
        </Section>
      )}

      {hasAffiliations && (
        <Section title="Affiliations">
          {isContributor && profile.montessoriNotes && (
            <p className="text-sm text-[#4A433D]">{profile.montessoriNotes}</p>
          )}
          {profile.affiliations.map((affiliation) => (
            <OrganizationCard
              key={`${affiliation.organization}-${affiliation.role ?? ""}`}
              refItem={affiliation}
            />
          ))}
        </Section>
      )}

      <ContributionsSection contributions={contributions} name={profile.name} />

      {profile.notableAchievements.length > 0 && (
        <Section title="Notable achievements">
          <ul className="flex flex-col">
            {profile.notableAchievements.map((achievement) => (
              <li
                className="flex items-center gap-2.5 border-b border-black/7 py-2 text-sm"
                key={achievement}
              >
                <TrophyIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-3.5 shrink-0"
                />
                {achievement}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {profile.quotes.length > 0 && (
        <div className="flex flex-col gap-4">
          {profile.quotes.map((quote) => (
            <blockquote
              className="border-l-primary/35 border-l-[3px] pl-5 font-serif text-[1.375rem] leading-snug italic"
              key={quote}
            >
              &ldquo;{quote}&rdquo;
            </blockquote>
          ))}
        </div>
      )}
    </div>
  );
};

const sourceRowClass =
  "flex min-w-0 items-start gap-2.5 rounded-lg border border-black/8 bg-white/55 px-3 py-2.5";

const SourceRow = ({ source }: { source: Source }) => {
  const Icon = SOURCE_ICONS[source.type] ?? LinkIcon;
  const label = SOURCE_LABELS[source.type];
  const host = source.url ? prettyUrl(source.url).split("/")[0] : null;
  const body = (
    <>
      <Icon aria-label={label} className="text-muted-foreground mt-0.5 size-3.5 shrink-0" />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="line-clamp-2 text-[13px] leading-snug font-medium">
          {source.note ?? label}
        </span>
        <span className="text-muted-foreground truncate text-xs">{host ?? label}</span>
      </span>
    </>
  );
  return source.url ? (
    <Link
      className={cn(sourceRowClass, "transition-colors hover:border-black/20 hover:bg-white")}
      href={source.url}
      rel="noopener"
      target="_blank"
      title={source.note}
    >
      {body}
    </Link>
  ) : (
    <div className={sourceRowClass} title={source.note}>
      {body}
    </div>
  );
};

/**
 * The right rail of a profile (below the main column on smaller screens): its
 * sources, related people, links elsewhere, the record's permanent link and
 * identifiers, and a way to suggest a correction.
 */
export const ProfileRail = ({
  profile,
  identifiers,
  related,
  permanentId,
  correctionUrl,
}: {
  profile: Profile;
  identifiers: IdentifierLink[];
  related: RelatedPerson[];
  permanentId: { value: string; url: string };
  correctionUrl: string;
}) => (
  <aside aria-label="About this record" className="flex min-w-0 flex-col gap-8">
    {profile.sources.length > 0 && (
      <Section count={profile.sources.length} id="sources" info={<HowWeVerify />} title="Sources">
        <ul className="flex flex-col gap-1.5">
          {profile.sources.map((source) => (
            <li className="min-w-0" key={`${source.type}-${source.url ?? source.note}`}>
              <SourceRow source={source} />
            </li>
          ))}
        </ul>
      </Section>
    )}

    {related.length > 0 && (
      <Section
        count={related.length}
        info={
          <Popover>
            <PopoverTrigger
              render={
                <button
                  aria-label="About related people"
                  className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full hover:bg-black/5"
                  data-print-hidden
                  type="button"
                />
              }
            >
              <InfoIcon aria-hidden="true" className="size-3.5" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72 text-sm">
              Co-authors come from shared contributions. Training, advising, and family
              relationships are added with a source.
            </PopoverContent>
          </Popover>
        }
        title="Related people"
      >
        <ul className="flex flex-col gap-1.5">
          {related.map((person) => (
            <li key={`${person.slug}-${person.relation}`}>
              <Link
                className="flex min-w-0 items-center gap-3 rounded-lg border border-black/10 bg-white/55 px-3 py-2.5 transition-colors hover:border-black/25 hover:bg-white"
                href={`/${person.slug}`}
              >
                <ProfilePhoto
                  className="size-9"
                  initialClassName="text-base"
                  name={person.name}
                  size={36}
                  src={person.imageUrl}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{person.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {RELATION_LABELS[person.relation]}
                    {person.count
                      ? ` · ${person.count} contribution${person.count === 1 ? "" : "s"}`
                      : ""}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    )}

    {profile.links.length > 0 && (
      <Section title="Elsewhere">
        <ul className="flex flex-col gap-2">
          {profile.links.map((link) => (
            <li className="min-w-0" key={link.url}>
              <Link
                className={cn(
                  sourceRowClass,
                  "items-center transition-colors hover:border-black/20 hover:bg-white"
                )}
                href={link.url}
                rel="noopener"
                target="_blank"
              >
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-medium">{LINK_LABELS[link.type] ?? "Link"}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {prettyUrl(link.url)}
                  </span>
                </span>
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-4 shrink-0"
                />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    )}

    <div className="flex flex-col gap-3">
      <RecordDetails
        id={permanentId.value}
        identifiers={identifiers}
        permanentUrl={permanentId.url}
      >
        {profile.glossaryCitations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-black/7 pt-3">
            <span className="text-muted-foreground text-xs">Cited in the Montessori Glossary:</span>
            {profile.glossaryCitations.map((citation) => (
              <Badge
                className="bg-white"
                key={citation.url}
                render={<Link href={citation.url} rel="noopener" target="_blank" />}
                variant="outline"
              >
                {citation.label}
              </Badge>
            ))}
          </div>
        )}
      </RecordDetails>

      <CorrectionButton href={correctionUrl} />
    </div>
  </aside>
);
