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
import { useState } from "react";
import type { ReactNode } from "react";

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

const Section = ({
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
}) => (
  <section className="flex w-full scroll-mt-24 flex-col gap-2.5" id={id}>
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-1.5">
        <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
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
      className="flex items-center gap-3.5 rounded-lg border border-black/10 bg-white/55 px-3.5 py-3 transition-colors hover:border-black/25 hover:bg-white"
      href={`/organizations/${refItem.organization}`}
    >
      <OrgLogo className="size-9" icon={Icon} logoUrl={refItem.organizationLogoUrl} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-semibold">
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
  const [showAllContributions, setShowAllContributions] = useState(false);
  if (contributions.length === 0) {
    return null;
  }
  const visibleContributions = showAllContributions
    ? contributions
    : contributions.slice(0, CONTRIBUTIONS_PREVIEW);

  return (
    <Section count={contributions.length} id="contributions" title="Contributions">
      <ul className="flex flex-col">
        {visibleContributions.map((c) => {
          const Icon = CONTRIBUTION_ICONS[c.type] ?? FileTextIcon;
          const withLine = coauthorLine(c.authors, name);
          const body = (
            <>
              <Icon
                aria-label={toTitleCase(c.type)}
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium">
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
                    <ArrowUpRightIcon className="text-muted-foreground ml-1.5 inline size-3" />
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {[c.venue, c.host].filter(Boolean).join(" · ")}
                </span>
                {withLine && (
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[#4A433D]">
                    <UsersIcon className="size-3" />
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
            <li className="border-b border-black/7" key={`${c.title}-${c.year ?? ""}`}>
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
          className="self-start py-1.5 text-sm font-semibold hover:underline"
          onClick={() => setShowAllContributions((v) => !v)}
          type="button"
        >
          {showAllContributions ? "Show fewer" : `Show all ${contributions.length}`}
        </button>
      )}
    </Section>
  );
};

const ProfileDetails = ({
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
}) => {
  const isAlum = profile.kinds.includes("alum");
  const isContributor = profile.kinds.includes("contributor");

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
              className="border-l-primary/35 border-l-[3px] pl-5 font-serif text-[22px] leading-snug italic"
              key={quote}
            >
              &quot;{quote}&quot;
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
            <p className="text-sm text-[#4A433D]">{profile.educationNotes}</p>
          )}
        </Section>
      )}

      {(profile.affiliations.length > 0 || (isContributor && profile.montessoriNotes)) && (
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
                <TrophyIcon className="text-muted-foreground size-3.5 shrink-0" />
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
                    className="text-muted-foreground hover:text-foreground flex size-6 items-center justify-center rounded-full hover:bg-black/5"
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
                  <span className="truncate text-sm font-medium">{person.name}</span>
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
            className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
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
};
export default ProfileDetails;
