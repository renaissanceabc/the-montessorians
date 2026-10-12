"use client";

import { CheckIcon, CopyIcon, LinkIcon, NewspaperIcon, ShareIcon } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";
import {
  ImdbIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WikipediaIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons";
import { ShareDialogTrigger } from "@/components/share-dialog-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { ProfilePage } from "@/lib/content/types";
import { prettyUrl, toTitleCase } from "@/lib/utils";

/** Contributions shown before "Show all". */
const CONTRIBUTIONS_PREVIEW = 3;
/** Tags shown under the name. */
const MAX_TAGS = 3;

export type OrganizationLabel = { slug: string; name: string };
export type IdentifierLink = { label: string; value: string; url: string };
export type ContributionLink = {
  title: string;
  meta: string;
  url: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  wikipedia: "Wikipedia",
  article: "Article or interview",
  social: "Social post",
  publication: "Publication",
  authority: "Authority record",
  "personal-knowledge": "Personal knowledge",
  other: "Source",
};

const VERIFICATION_LABELS: Record<string, string> = {
  verified: "Verified by a published source",
  reported: "Reported, not yet independently verified",
  confirmed: "Confirmed by the person or the maintainers",
  unverified: "Unverified: no reliable source yet. Know one? Suggest a correction.",
};

function yearRange(from?: number, to?: number) {
  if (from && to) {
    return from === to ? `${from}` : `${from}–${to}`;
  }
  if (from) {
    return `${from}–`;
  }
  return to ? `–${to}` : "";
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="font-semibold">{label}</dt>
      <dd className="col-span-2 flex flex-col gap-2">{children}</dd>
    </>
  );
}

export default function ProfileDetails({
  profile,
  organizations,
  identifiers,
  contributions,
  correctionUrl,
  permanentUrl,
}: {
  profile: ProfilePage["profile"];
  organizations: Record<string, OrganizationLabel>;
  identifiers: IdentifierLink[];
  contributions: ContributionLink[];
  correctionUrl: string;
  /** The record's permanent URI (/id/<id>) */
  permanentUrl: string;
}) {
  const [showAllContributions, setShowAllContributions] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!profile) {
    return <div>No profile found</div>;
  }

  const linkIcons = {
    wikipedia: <WikipediaIcon className="h-4 w-4" />,
    linkedin: <LinkedInIcon className="h-4 w-4" />,
    website: <LinkIcon className="h-4 w-4" />,
    x: <XIcon className="h-4 w-4" />,
    tiktok: <TikTokIcon className="h-4 w-4" />,
    instagram: <InstagramIcon className="h-4 w-4" />,
    article: <NewspaperIcon className="h-4 w-4" />,
    youtube: <YouTubeIcon className="h-4 w-4" />,
    imdb: <ImdbIcon className="h-4 w-4" />,
  };

  const isContributor = profile.kind === "contributor";
  const orgName = (slug: string) => organizations[slug]?.name ?? toTitleCase(slug);
  const visibleContributions = showAllContributions
    ? contributions
    : contributions.slice(0, CONTRIBUTIONS_PREVIEW);
  const copyPermanentUrl = async () => {
    try {
      await navigator.clipboard.writeText(permanentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the link");
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-2">
        <Avatar className="h-48 w-48 rounded-full border border-gray-200">
          <AvatarImage alt={profile.name} src={profile.imageUrl ?? ""} />
          <AvatarFallback className="font-serif text-6xl">
            {profile.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {profile.imageCredit && (
          <p className="max-w-xs text-center text-muted-foreground text-xs">
            {profile.imageCredit}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="space-y-2 text-center">
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {isContributor ? "Contributor" : "Alum"}
          </p>
          <h1 className="text-center font-semibold font-serif text-4xl">{profile.name}</h1>

          {profile.tagline && (
            <p className="text-center text-muted-foreground text-xl italic">{profile.tagline}</p>
          )}
        </div>

        {profile.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {profile.tags.slice(0, MAX_TAGS).map((tag) => (
              <Badge asChild className="bg-white/50" key={tag.slug} variant="outline">
                <Link href={`/tags/${tag.slug}`}>{tag.label}</Link>
              </Badge>
            ))}
          </div>
        )}

        <ShareDialogTrigger profile={profile}>
          {({ onClick }) => (
            <Button className="text-xs" onClick={onClick} size="sm" variant="ghost">
              <ShareIcon className="h-4 w-4" />
              <span>Share this profile</span>
            </Button>
          )}
        </ShareDialogTrigger>
      </div>

      <Separator className="w-full bg-black/10" />

      {profile.bio && <p className="text-base">{profile.bio}</p>}

      {profile.quotes.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="font-semibold text-sm">
            A quote from {profile.name} about their education:
          </p>

          <div className="space-y-4">
            {profile.quotes.map((quote) => (
              <blockquote
                className="border-l-4 border-l-primary/25 pl-5 text-lg text-primary italic sm:pl-10"
                key={quote}
              >
                <p>"{quote}"</p>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      <Separator className="w-full bg-black/10" />

      <dl className="grid w-full grid-cols-3 gap-x-10 gap-y-5 text-sm">
        {isContributor && profile.montessoriNotes && (
          <Row label="Montessori Notes">
            <p>{profile.montessoriNotes}</p>
          </Row>
        )}

        {!isContributor && profile.educationNotes && (
          <Row label="Education Notes">
            <p>{profile.educationNotes}</p>
          </Row>
        )}

        {profile.schools.length > 0 && (
          <Row label="Montessori School">
            {profile.schools.map((school) => (
              <p key={`${school.organization}-${school.from ?? ""}`}>
                <Link
                  className="underline hover:text-primary"
                  href={`/organizations/${school.organization}`}
                >
                  {orgName(school.organization)}
                </Link>
                {(school.level || school.from || school.to) && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {[school.level && toTitleCase(school.level), yearRange(school.from, school.to)]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </p>
            ))}
          </Row>
        )}

        {profile.affiliations.length > 0 && (
          <Row label="Affiliations">
            {profile.affiliations.map((affiliation) => (
              <p key={`${affiliation.organization}-${affiliation.role ?? ""}`}>
                <Link
                  className="underline hover:text-primary"
                  href={`/organizations/${affiliation.organization}`}
                >
                  {orgName(affiliation.organization)}
                </Link>
                {(affiliation.role || affiliation.from || affiliation.to) && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {[affiliation.role, yearRange(affiliation.from, affiliation.to)]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                )}
              </p>
            ))}
          </Row>
        )}

        {contributions.length > 0 && (
          <Row label="Notable Contributions">
            <ul className="list-disc space-y-1.5 pl-4">
              {visibleContributions.map((contribution) => (
                <li className="pl-2" key={`${contribution.title}-${contribution.meta}`}>
                  {contribution.url ? (
                    <Link
                      className="underline hover:text-primary"
                      href={contribution.url}
                      target="_blank"
                    >
                      {contribution.title}
                    </Link>
                  ) : (
                    contribution.title
                  )}
                  {contribution.meta && (
                    <span className="text-muted-foreground"> · {contribution.meta}</span>
                  )}
                </li>
              ))}
            </ul>
            {contributions.length > CONTRIBUTIONS_PREVIEW && (
              <button
                className="self-start font-semibold text-sm hover:underline"
                onClick={() => setShowAllContributions((v) => !v)}
                type="button"
              >
                {showAllContributions
                  ? "Show fewer"
                  : `Show all ${contributions.length} contributions`}
              </button>
            )}
          </Row>
        )}

        {profile.notableAchievements.length > 0 && (
          <Row label="Notable Achievements">
            <ul className="list-disc space-y-1 pl-4">
              {profile.notableAchievements.map((achievement) => (
                <li className="pl-2" key={achievement}>
                  {achievement}
                </li>
              ))}
            </ul>
          </Row>
        )}

        {profile.sources.length > 0 && (
          <Row label="Sources">
            {profile.sources.map((source) => (
              <div className="flex flex-col" key={`${source.type}-${source.url ?? source.note}`}>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">
                  {SOURCE_LABELS[source.type] ?? "Source"}
                </span>
                {source.url ? (
                  <Link
                    className="wrap-anywhere underline hover:text-primary"
                    href={source.url}
                    target="_blank"
                  >
                    {source.note ?? prettyUrl(source.url)}
                  </Link>
                ) : (
                  <span>{source.note}</span>
                )}
              </div>
            ))}
            {profile.verification && (
              <p className="text-muted-foreground text-xs">
                {VERIFICATION_LABELS[profile.verification]}
              </p>
            )}
          </Row>
        )}

        {profile.links.length > 0 && (
          <Row label="Links">
            {profile.links.map((link) => (
              <Link
                className="wrap-anywhere flex flex-row gap-2 underline hover:text-primary"
                href={link.url}
                key={link.url}
                target="_blank"
              >
                <span className="mt-1 size-4 shrink-0">{linkIcons[link.type]}</span>
                {prettyUrl(link.url)}
              </Link>
            ))}
          </Row>
        )}
      </dl>

      <section className="flex w-full flex-col gap-4 rounded-lg border border-black/10 bg-white/60 p-6 text-sm">
        <h2 className="font-semibold font-serif text-2xl">Identifiers</h2>

        <dl className="grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5">
          <dt className="text-muted-foreground">The Montessorians</dt>
          <dd className="flex items-center gap-1.5">
            <Link className="font-mono text-xs underline hover:text-primary" href={permanentUrl}>
              {profile.id}
            </Link>
            <button
              aria-label={copied ? "Copied" : `Copy the permanent link for ${profile.name}`}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground"
              onClick={copyPermanentUrl}
              title="Copy permanent link"
              type="button"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            </button>
          </dd>
          {identifiers.map((identifier) => (
            <div className="contents" key={identifier.label}>
              <dt className="text-muted-foreground">{identifier.label}</dt>
              <dd>
                <Link
                  className="font-mono text-xs underline hover:text-primary"
                  href={identifier.url}
                  target="_blank"
                >
                  {identifier.value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>

        {profile.glossaryCitations.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground">Cited in the Montessori Glossary</span>
            <div className="flex flex-wrap gap-1">
              {profile.glossaryCitations.map((citation) => (
                <Badge asChild className="bg-white" key={citation.url} variant="outline">
                  <Link href={citation.url} target="_blank">
                    {citation.label} ↗
                  </Link>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-xs">
          <Link className="hover:underline" href={correctionUrl} target="_blank">
            Suggest a correction
          </Link>
        </p>
      </section>
    </div>
  );
}
