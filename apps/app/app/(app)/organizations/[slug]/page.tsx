import {
  ArrowUpRightIcon,
  Building2Icon,
  CalendarIcon,
  GlobeIcon,
  GraduationCapIcon,
  LandmarkIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { Container } from "@/components/container";
import { OrgLogo } from "@/components/org-logo";
import ProfileListItem from "@/components/profile-list-item";
import { RecordLayout } from "@/components/record-layout";
import { CorrectionButton, RecordDetails } from "@/components/record-rail";
import { ShareButton } from "@/components/share-button";
import { identifierEntries, idUrl, organizationJsonLd } from "@/lib/content/authority";
import { formatLocation } from "@/lib/content/location";
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
    image: `${siteUrl}/api/og/organizations/${slug}.png`,
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
  <section className="flex w-full min-w-0 flex-col gap-2.5">
    <h2 className="type-eyebrow">
      {title}
      {count !== undefined && <span className="font-normal"> · {count}</span>}
    </h2>
    {children}
  </section>
);

// Separators only on the single-line pill; on phones the facts wrap freely.
const Dot = () => (
  <span aria-hidden="true" className="px-1 text-black/25 max-sm:hidden">
    ·
  </span>
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
  const permanentUrl = idUrl(org.id);
  const correction = githubIssueUrl("04_correction.yml", {
    record: org.id,
    title: `Correction: ${org.name} (${org.id})`,
  });

  const main = (
    <>
      <header className="flex w-full min-w-0 flex-col gap-5 max-sm:items-center max-sm:text-center">
        {/* Phones: logo on its own row and the header centered, as on person profiles. */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
          <OrgLogo
            className="size-28 rounded-2xl border border-black/10"
            icon={Icon}
            iconClassName="size-10 text-muted-foreground"
            logoUrl={org.logoUrl}
            size={112}
          />
          <h1 className="type-title min-w-0">
            {org.name}
            {org.shortName && (
              <span className="text-muted-foreground font-normal"> ({org.shortName})</span>
            )}
          </h1>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#4A433D] max-sm:justify-center sm:w-fit sm:gap-x-0 sm:rounded-3xl sm:border sm:border-black/10 sm:bg-white/60 sm:px-4 sm:py-1.5">
            <span className="type-eyebrow shrink-0 max-sm:basis-full">
              {ORGANIZATION_TYPE_LABELS[org.type]}
            </span>
            {org.location && (
              <>
                <Dot />
                <span className="inline-flex min-w-0 items-center gap-1" title={org.location}>
                  <MapPinIcon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="truncate">{formatLocation(org.location)}</span>
                </span>
              </>
            )}
            {org.founded && (
              <>
                <Dot />
                <span className="inline-flex shrink-0 items-center gap-1">
                  <CalendarIcon aria-hidden="true" className="size-3.5 sm:hidden" />
                  Founded {org.founded}
                </span>
              </>
            )}
            <Dot />
            <span
              className="inline-flex shrink-0 items-center gap-1"
              title={`${people} ${people === 1 ? "person" : "people"} in the directory`}
            >
              <UsersIcon aria-hidden="true" className="size-3.5" />
              {people} {people === 1 ? "person" : "people"}
            </span>
          </div>
          <ShareButton
            target={{ kind: "organization", name: org.name, path: `/organizations/${org.slug}` }}
          />
        </div>
      </header>

      {(org.description || parent) && (
        <div className="flex flex-col gap-3">
          {org.description && <p className="type-body">{org.description}</p>}
          {parent && (
            <p className="text-sm">
              Part of{" "}
              <Link className="hover:text-primary underline" href={`/organizations/${parent.slug}`}>
                {parent.name}
              </Link>
            </p>
          )}
        </div>
      )}

      {people === 0 && (
        <div
          className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-black/20 p-5 text-sm"
          data-print-hidden
        >
          <p className="text-muted-foreground">
            No one in the directory is linked to {org.name} yet.
          </p>
          <Link className="inline-flex items-center gap-2 font-medium underline" href="/contribute">
            <UserPlusIcon aria-hidden="true" className="size-4" />
            Add a Montessorian
          </Link>
        </div>
      )}

      {attended.length > 0 && (
        <Section count={attended.length} title="Alumni">
          <ul className="flex flex-col gap-2">
            {attended.map(({ profile, ref }) => (
              <li key={`${profile.slug}-attended`}>
                <ProfileListItem
                  hideOrganization={org.slug}
                  detail={[ref.level && toTitleCase(ref.level), yearRange(ref)]
                    .filter(Boolean)
                    .join(" · ")}
                  profile={profile}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {affiliated.length > 0 && (
        <Section count={affiliated.length} title="Affiliated people">
          <ul className="flex flex-col gap-2">
            {affiliated.map(({ profile, ref }) => (
              <li key={`${profile.slug}-${ref.role ?? ""}`}>
                <ProfileListItem
                  hideOrganization={org.slug}
                  detail={[ref.role, yearRange(ref)].filter(Boolean).join(" · ")}
                  profile={profile}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );

  const rail = (
    <aside aria-label="About this record" className="flex min-w-0 flex-col gap-8">
      {org.website && (
        <Section title="Website">
          <Link
            className="flex min-w-0 items-center gap-2.5 rounded-lg border border-black/8 bg-white/55 px-3 py-2.5 transition-colors hover:border-black/20 hover:bg-white"
            href={org.website}
            rel="noopener"
            target="_blank"
          >
            <GlobeIcon aria-hidden="true" className="text-muted-foreground size-4 shrink-0" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium">Official website</span>
              <span className="text-muted-foreground truncate text-xs">
                {prettyUrl(org.website)}
              </span>
            </span>
            <ArrowUpRightIcon
              aria-hidden="true"
              className="text-muted-foreground size-4 shrink-0"
            />
          </Link>
        </Section>
      )}

      <div className="flex flex-col gap-3">
        <RecordDetails id={org.id} identifiers={identifiers} permanentUrl={permanentUrl} />
        <CorrectionButton href={correction} />
      </div>
    </aside>
  );

  return (
    <>
      <Container className="flex flex-col gap-6 pt-2 pb-16 max-sm:pb-24 lg:pt-4">
        <Breadcrumbs
          align="start"
          items={[{ href: "/organizations", label: "Organizations" }, { label: org.name }]}
        />
        <RecordLayout main={main} permanentUrl={permanentUrl} rail={rail} />
        {org.logoUrl && org.logoSource && (
          <p className="text-muted-foreground text-xs [overflow-wrap:anywhere]">
            Logo from{" "}
            {URL.canParse(org.logoSource) ? (
              <Link className="underline" href={org.logoSource} rel="noopener" target="_blank">
                {new URL(org.logoSource).hostname.replace(/^www\./u, "")}
              </Link>
            ) : (
              org.logoSource
            )}
          </p>
        )}
      </Container>

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
