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
import { type ReactNode, useState } from "react";
import { OrgLogo } from "@/components/org-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HowWeVerify } from "@/components/verification";
import type {
  Contribution,
  OrganizationRef,
  Profile,
  RelatedPerson,
  Source,
} from "@/lib/content/types";
import { prettyUrl, toTitleCase } from "@/lib/utils";

/** Contributions shown before "Show all". */
const CONTRIBUTIONS_PREVIEW = 3;
/** Co-authors named before "and N others". */
const COAUTHORS_SHOWN = 2;

export type IdentifierLink = { label: string; value: string; url: string };
export type ContributionLink = Contribution & { href: string | null; host: string | null };

const RELATION_LABELS: Record<RelatedPerson["relation"], string> = {
  coauthor: "Co-author",
  parent: "Parent",
  child: "Child",
  sibling: "Sibling",
  spouse: "Spouse",
  trained_by: "Trained under",
  trained: "Trained",
  advisor: "Doctoral advisor",
  advisee: "Advised",
  colleague: "Colleague",
};

const SOURCE_LABELS: Record<Source["type"], string> = {
  wikipedia: "Wikipedia",
  article: "Article",
  social: "Post",
  publication: "Publication",
  authority: "Library record",
  "personal-knowledge": "Personal knowledge",
  other: "Source",
};

const SOURCE_ICONS: Record<Source["type"], typeof GlobeIcon> = {
  wikipedia: GlobeIcon,
  article: NewspaperIcon,
  social: MessageCircleIcon,
  publication: FileTextIcon,
  authority: LandmarkIcon,
  "personal-knowledge": UsersIcon,
  other: LinkIcon,
};

const CONTRIBUTION_ICONS: Record<Contribution["type"], typeof BookIcon> = {
  book: BookIcon,
  article: FileTextIcon,
  chapter: FileTextIcon,
  lecture: MicIcon,
  "training-program": PresentationIcon,
  media: MicIcon,
  other: FileTextIcon,
};

const yearRange = (from?: number, to?: number) =>
  from && to
    ? from === to
      ? `${from}`
      : `${from} – ${to}`
    : from
      ? `${from} – present`
      : to
        ? `until ${to}`
        : "";

/** "with Nicole Else-Quest" / "with Heise, Richey, and 3 others", leaving out the person themselves. */
function coauthorLine(authors: string[] | undefined, name: string): string | null {
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
}

function Section({
  title,
  count,
  info,
  aside,
  id,
  children,
}: {
  title: string;
  count?: number;
  info?: ReactNode;
  aside?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full scroll-mt-24 flex-col gap-2.5" id={id}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
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
}

function OrganizationCard({ refItem, school }: { refItem: OrganizationRef; school?: boolean }) {
  const Icon = school ? GraduationCapIcon : Building2Icon;
  const range = yearRange(refItem.from, refItem.to);
  const detail = [refItem.role, refItem.level && toTitleCase(refItem.level)]
    .filter(Boolean)
    .join(" · ");
  return (
    <Link
      className="flex items-center gap-3.5 rounded-lg border border-black/10 bg-white/55 px-3.5 py-3 transition-colors hover:border-black/25 hover:bg-white"
      href={`/organizations/${refItem.organization}`}
    >
      <OrgLogo className="size-9" icon={Icon} logoUrl={refItem.organizationLogoUrl} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-semibold text-sm">
          {refItem.organizationName ?? refItem.organization}
          {refItem.organizationShortName && (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({refItem.organizationShortName})
            </span>
          )}
        </span>
        {detail && <span className="text-muted-foreground text-sm">{detail}</span>}
      </span>
      {range && (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">{range}</span>
      )}
    </Link>
  );
}

export default function ProfileDetails({
  profile,
  identifiers,
  contributions,
  related,
  permanentId,
  correctionUrl,
}: {
  profile: Profile;
  identifiers: IdentifierLink[];
  contributions: ContributionLink[];
  related: RelatedPerson[];
  permanentId: { value: string; url: string };
  correctionUrl: string;
}) {
  const [showAllContributions, setShowAllContributions] = useState(false);
  const isAlum = profile.kinds.includes("alum");
  const isContributor = profile.kinds.includes("contributor");
  const visibleContributions = showAllContributions
    ? contributions
    : contributions.slice(0, CONTRIBUTIONS_PREVIEW);

  return (
    <div className="flex w-full flex-col gap-9">
      {(profile.bio || profile.tags.length > 0) && (
        <div className="flex flex-col gap-3">
          {profile.bio && <p className="text-base">{profile.bio}</p>}
          {profile.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {profile.tags.map((tag) => (
                <Badge
                  className="bg-white/50"
                  key={tag.slug}
                  render={<Link href={`/tags/${tag.slug}`} />}
                  variant="outline"
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {profile.quotes.length > 0 && (
        <div className="flex flex-col gap-4">
          {profile.quotes.map((quote) => (
            <blockquote
              className="border-l-[3px] border-l-primary/35 pl-5 font-serif text-[22px] italic leading-snug"
              key={quote}
            >
              "{quote}"
            </blockquote>
          ))}
        </div>
      )}

      {isAlum && (profile.schools.length > 0 || profile.educationNotes) && (
        <Section title="Montessori education">
          {profile.schools.map((school) => (
            <OrganizationCard
              key={`${school.organization}-${school.from ?? ""}`}
              refItem={school}
              school
            />
          ))}
          {profile.educationNotes && (
            <p className="text-[#4A433D] text-sm">{profile.educationNotes}</p>
          )}
        </Section>
      )}

      {(profile.affiliations.length > 0 || (isContributor && profile.montessoriNotes)) && (
        <Section title="Affiliations">
          {isContributor && profile.montessoriNotes && (
            <p className="text-[#4A433D] text-sm">{profile.montessoriNotes}</p>
          )}
          {profile.affiliations.map((affiliation) => (
            <OrganizationCard
              key={`${affiliation.organization}-${affiliation.role ?? ""}`}
              refItem={affiliation}
            />
          ))}
        </Section>
      )}

      {contributions.length > 0 && (
        <Section count={contributions.length} id="contributions" title="Contributions">
          <ul className="flex flex-col">
            {visibleContributions.map((c) => {
              const Icon = CONTRIBUTION_ICONS[c.type] ?? FileTextIcon;
              const withLine = coauthorLine(c.authors, profile.name);
              const body = (
                <>
                  <Icon
                    aria-label={toTitleCase(c.type)}
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-medium text-sm">
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
                        <ArrowUpRightIcon className="ml-1.5 inline size-3 text-muted-foreground" />
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {[c.venue, c.host].filter(Boolean).join(" · ")}
                    </span>
                    {withLine && (
                      <span className="mt-0.5 flex items-center gap-1.5 text-[#4A433D] text-xs">
                        <UsersIcon className="size-3" />
                        <span>{withLine}</span>
                      </span>
                    )}
                  </span>
                  {c.year && (
                    <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                      {c.year}
                    </span>
                  )}
                </>
              );
              return (
                <li className="border-black/7 border-b" key={`${c.title}-${c.year ?? ""}`}>
                  {c.href ? (
                    <Link
                      className="group flex items-start gap-2.5 py-2.5"
                      href={c.href}
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
              className="self-start py-1.5 font-semibold text-sm hover:underline"
              onClick={() => setShowAllContributions((v) => !v)}
              type="button"
            >
              {showAllContributions ? "Show fewer" : `Show all ${contributions.length}`}
            </button>
          )}
        </Section>
      )}

      {profile.notableAchievements.length > 0 && (
        <Section title="Notable achievements">
          <ul className="flex flex-col">
            {profile.notableAchievements.map((achievement) => (
              <li
                className="flex items-center gap-2.5 border-black/7 border-b py-2 text-sm"
                key={achievement}
              >
                <TrophyIcon className="size-3.5 shrink-0 text-muted-foreground" />
                {achievement}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {related.length > 0 && (
        <Section
          info={
            <Popover>
              <PopoverTrigger
                render={
                  <button
                    aria-label="About related people"
                    className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground"
                    type="button"
                  />
                }
              >
                <InfoIcon className="size-3.5" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-72 text-sm">
                Co-authors come from shared contributions. Training, advising, and family
                relationships are added with a source.
              </PopoverContent>
            </Popover>
          }
          title="Related people"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            {related.map((person) => (
              <Link
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-white/55 px-3 py-2.5 transition-colors hover:border-black/25 hover:bg-white"
                href={`/${person.slug}`}
                key={`${person.slug}-${person.relation}`}
              >
                <Avatar className="size-9">
                  <AvatarImage alt="" src={person.imageUrl ?? ""} />
                  <AvatarFallback className="font-serif">{person.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium text-sm">{person.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {RELATION_LABELS[person.relation]}
                    {person.count
                      ? ` · ${person.count} contribution${person.count === 1 ? "" : "s"}`
                      : ""}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {profile.sources.length > 0 && (
        <Section id="sources" info={<HowWeVerify />} title="Sources">
          <div className="flex flex-wrap gap-1.5">
            {profile.sources.map((source) => {
              const Icon = SOURCE_ICONS[source.type] ?? LinkIcon;
              const host = source.url ? prettyUrl(source.url).split("/")[0] : null;
              const chip = (
                <>
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">
                    {[SOURCE_LABELS[source.type], host].filter(Boolean).join(" · ")}
                  </span>
                </>
              );
              return source.url ? (
                <Link
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-black/12 bg-white px-3 py-1.5 text-[13px] transition-colors hover:border-black/30"
                  href={source.url}
                  key={`${source.type}-${source.url}`}
                  target="_blank"
                  title={source.note}
                >
                  {chip}
                </Link>
              ) : (
                <span
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-black/12 bg-white px-3 py-1.5 text-[13px]"
                  key={`${source.type}-${source.note}`}
                  title={source.note}
                >
                  {chip}
                </span>
              );
            })}
          </div>
        </Section>
      )}

      {profile.links.length > 0 && (
        <Section title="Links">
          <div className="flex flex-wrap gap-1.5">
            {profile.links.map((link) => (
              <Link
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-black/12 bg-white px-3 py-1.5 text-[13px] transition-colors hover:border-black/30"
                href={link.url}
                key={link.url}
                target="_blank"
              >
                <ArrowUpRightIcon className="size-3.5 shrink-0" />
                <span className="truncate">{prettyUrl(link.url)}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section
        aside={
          <Link
            className="text-muted-foreground text-xs hover:underline"
            href={correctionUrl}
            target="_blank"
          >
            Suggest a correction
          </Link>
        }
        title="Identifiers"
      >
        <div className="flex flex-wrap gap-1.5">
          <Link
            className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground text-xs"
            href={permanentId.url}
          >
            <span className="opacity-75">The Montessorians</span>
            <span className="font-mono">{permanentId.value}</span>
          </Link>
          {identifiers.map((identifier) => (
            <Link
              className="inline-flex items-center gap-1.5 rounded-md border border-black/12 bg-white px-2.5 py-1.5 text-xs transition-colors hover:border-black/30"
              href={identifier.url}
              key={identifier.label}
              target="_blank"
            >
              <span className="text-muted-foreground">{identifier.label}</span>
              <span className="font-mono">{identifier.value}</span>
            </Link>
          ))}
        </div>
        {profile.glossaryCitations.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-muted-foreground text-xs">Cited in the Montessori Glossary:</span>
            {profile.glossaryCitations.map((citation) => (
              <Badge
                className="bg-white"
                key={citation.url}
                render={<Link href={citation.url} target="_blank" />}
                variant="outline"
              >
                {citation.label}
              </Badge>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
