import {
  Building2Icon,
  GlobeIcon,
  GraduationCapIcon,
  LandmarkIcon,
  MapPinIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CiteButton } from "@/components/cite-button";
import { OrgLogo } from "@/components/org-logo";
import ProfileListItem from "@/components/profile-list-item";
import { identifierEntries, idUrl, organizationJsonLd } from "@/lib/content/authority";
import {
  getAllOrganizations,
  getOrganizationBySlug,
  getOrganizationMembers,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/content/organizations";
import type { OrganizationRef, OrganizationType } from "@/lib/content/types";
import { createMetadata } from "@/lib/metadata";
import { githubIssueUrl } from "@/lib/url";
import { prettyUrl, siteUrl, toTitleCase } from "@/lib/utils";

export function generateStaticParams() {
  return getAllOrganizations().map((org) => ({ slug: org.slug }));
}

export const dynamicParams = false;

const TYPE_ICONS: Partial<Record<OrganizationType, typeof Building2Icon>> = {
  school: GraduationCapIcon,
  association: LandmarkIcon,
};

const yearRange = (ref: OrganizationRef) =>
  ref.from && ref.to
    ? `${ref.from} – ${ref.to}`
    : ref.from
      ? `${ref.from} – present`
      : ref.to
        ? `until ${ref.to}`
        : "";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }
  return createMetadata({
    title: org.name,
    description: org.description ?? `${org.name} on The Montessorians.`,
    alternates: {
      canonical: `${siteUrl}/organizations/${slug}`,
      types: { "application/ld+json": `${siteUrl}/data/${org.id}` },
    },
  });
}

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <section className="flex w-full flex-col gap-2">
      <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
        {title}
        {count !== undefined && <span className="font-normal"> · {count}</span>}
      </h2>
      {children}
    </section>
  );
}

export default async function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }

  const members = getOrganizationMembers(slug);
  const attended = members.filter((m) => m.relation === "attended");
  const affiliated = members.filter((m) => m.relation === "affiliated");
  const people = new Set(members.map((m) => m.profile.slug)).size;
  const parent = org.parent ? getOrganizationBySlug(org.parent) : null;
  const identifiers = identifierEntries(org.identifiers);
  const Icon = TYPE_ICONS[org.type] ?? Building2Icon;
  const correction = githubIssueUrl("04_correction.yml", {
    title: `Correction: ${org.name} (${org.id})`,
    record: org.id,
  });

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-col items-center gap-9 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <Breadcrumbs
          items={[{ label: "Organizations", href: "/organizations" }, { label: org.name }]}
        />

        <div className="flex w-full min-w-0 flex-col items-center gap-4 text-center">
          <OrgLogo
            className="size-24 rounded-2xl border border-black/10"
            icon={Icon}
            iconClassName="size-10 text-muted-foreground"
            logoUrl={org.logoUrl}
          />
          <h1 className="font-semibold font-serif text-4xl">
            {org.name}
            {org.shortName && (
              <span className="font-normal text-muted-foreground"> ({org.shortName})</span>
            )}
          </h1>
          <div className="flex max-w-full items-center justify-center gap-1 rounded-full border border-black/10 bg-white/60 py-1 pr-1 pl-4 text-[#4A433D] text-sm">
            <span className="shrink-0 font-semibold text-[11px] text-muted-foreground uppercase tracking-wider">
              {ORGANIZATION_TYPE_LABELS[org.type]}
            </span>
            {org.location && (
              <>
                <span aria-hidden="true" className="px-1 text-black/25">
                  ·
                </span>
                <span className="inline-flex min-w-0 items-center gap-1" title={org.location}>
                  <MapPinIcon className="size-3.5 shrink-0" />
                  <span className="truncate">{org.location}</span>
                </span>
              </>
            )}
            {org.founded && (
              <span className="hidden shrink-0 sm:contents">
                <span aria-hidden="true" className="px-1 text-black/25">
                  ·
                </span>
                <span>Founded {org.founded}</span>
              </span>
            )}
            <span aria-hidden="true" className="px-1 text-black/25">
              ·
            </span>
            <span
              className="inline-flex shrink-0 items-center gap-1 pr-1"
              title={`${people} ${people === 1 ? "person" : "people"} in the directory`}
            >
              <UsersIcon className="size-3.5" />
              {people}
            </span>
            <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-black/12" />
            <CiteButton url={idUrl(org.id)} />
          </div>
        </div>

        {org.description && <p className="w-full text-base">{org.description}</p>}

        {parent && (
          <p className="w-full text-sm">
            Part of{" "}
            <Link className="underline hover:text-primary" href={`/organizations/${parent.slug}`}>
              {parent.name}
            </Link>
          </p>
        )}

        {attended.length > 0 && (
          <Section count={attended.length} title="Alumni">
            {attended.map(({ profile, ref }) => (
              <ProfileListItem
                detail={[ref.level && toTitleCase(ref.level), yearRange(ref)]
                  .filter(Boolean)
                  .join(" · ")}
                key={`${profile.slug}-attended`}
                profile={profile}
              />
            ))}
          </Section>
        )}

        {affiliated.length > 0 && (
          <Section count={affiliated.length} title="Affiliated people">
            {affiliated.map(({ profile, ref }) => (
              <ProfileListItem
                detail={[ref.role, yearRange(ref)].filter(Boolean).join(" · ")}
                key={`${profile.slug}-${ref.role ?? ""}`}
                profile={profile}
              />
            ))}
          </Section>
        )}

        <section className="flex w-full flex-col gap-2.5 border-black/10 border-t pt-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
              Identifiers
            </h2>
            <Link
              className="text-muted-foreground text-xs hover:underline"
              href={correction}
              target="_blank"
            >
              Suggest a correction
            </Link>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Link
              className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-secondary-foreground text-xs"
              href={idUrl(org.id)}
            >
              <span className="opacity-75">The Montessorians</span>
              <span className="font-mono">{org.id}</span>
            </Link>
            {org.website && (
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border border-black/12 bg-white px-2.5 py-1.5 text-xs hover:border-black/30"
                href={org.website}
                target="_blank"
              >
                <GlobeIcon className="size-3.5" />
                {prettyUrl(org.website)}
              </Link>
            )}
            {identifiers.map((identifier) => (
              <Link
                className="inline-flex items-center gap-1.5 rounded-md border border-black/12 bg-white px-2.5 py-1.5 text-xs hover:border-black/30"
                href={identifier.url}
                key={identifier.scheme}
                target="_blank"
              >
                <span className="text-muted-foreground">{identifier.label}</span>
                <span className="font-mono">{identifier.value}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(org)).replace(/</g, "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
}
