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

export const generateStaticParams = () => getAllOrganizations().map((org) => ({ slug: org.slug }));

export const dynamicParams = false;

const TYPE_ICONS: Partial<Record<OrganizationType, typeof Building2Icon>> = {
  association: LandmarkIcon,
  school: GraduationCapIcon,
};

const yearRange = (ref: OrganizationRef) => {
  if (ref.from && ref.to) {
    return `${ref.from} – ${ref.to}`;
  }
  if (ref.from) {
    return `${ref.from} – present`;
  }
  if (ref.to) {
    return `until ${ref.to}`;
  }
  return "";
};

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const org = getOrganizationBySlug(slug);
  if (!org) {
    notFound();
  }
  return createMetadata({
    alternates: {
      canonical: `${siteUrl}/organizations/${slug}`,
      types: { "application/ld+json": `${siteUrl}/data/${org.id}` },
    },
    description: org.description ?? `${org.name} on The Montessorians.`,
    title: org.name,
  });
};

const Section = ({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) => (
  <section className="flex w-full flex-col gap-2">
    <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
      {title}
      {count !== undefined && <span className="font-normal"> · {count}</span>}
    </h2>
    {children}
  </section>
);

const OrganizationPage = async ({ params }: { params: Promise<{ slug: string }> }) => {
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
    record: org.id,
    title: `Correction: ${org.name} (${org.id})`,
  });

  return (
    <>
      <div className="container mx-auto flex max-w-3xl flex-col items-center gap-9 px-4 pt-8 pb-12 sm:px-8 lg:pt-0">
        <Breadcrumbs
          items={[{ href: "/organizations", label: "Organizations" }, { label: org.name }]}
        />

        <div className="flex w-full min-w-0 flex-col items-center gap-4 text-center">
          <OrgLogo
            className="size-24 rounded-2xl border border-black/10"
            icon={Icon}
            iconClassName="size-10 text-muted-foreground"
            logoUrl={org.logoUrl}
          />
          <h1 className="font-serif text-4xl font-semibold">
            {org.name}
            {org.shortName && (
              <span className="text-muted-foreground font-normal"> ({org.shortName})</span>
            )}
          </h1>
          <div className="flex max-w-full items-center justify-center gap-1 rounded-full border border-black/10 bg-white/60 py-1 pr-1 pl-4 text-sm text-[#4A433D]">
            <span className="text-muted-foreground shrink-0 text-[11px] font-semibold tracking-wider uppercase">
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
            <Link className="hover:text-primary underline" href={`/organizations/${parent.slug}`}>
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

        <section className="flex w-full flex-col gap-2.5 border-t border-black/10 pt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
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
              className="bg-secondary text-secondary-foreground inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs"
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
        // oxlint-disable-next-line react/no-danger -- JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd(org)).replaceAll("<", "\\u003c"),
        }}
        type="application/ld+json"
      />
    </>
  );
};
export default OrganizationPage;
