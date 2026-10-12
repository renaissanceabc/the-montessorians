import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Verification } from "@/lib/content/types";
import { VERIFICATION_COPY } from "@/lib/content/verification";
import { createMetadata } from "@/lib/metadata";
import { githubIssueUrl, REPO_URL } from "@/lib/url";
import { siteUrl } from "@/lib/utils";

// The site version of docs/editorial-policy.md — keep the two in step.

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/about/editorial-policy`,
    },
    description:
      "Who The Montessorians includes, what counts as evidence, and how records are corrected.",
    title: "Editorial policy",
  });

const SECTIONS = [
  { id: "who", label: "Who we include" },
  { id: "evidence", label: "Evidence" },
  { id: "verification", label: "Verification" },
  { id: "corrections", label: "Corrections and removals" },
  { id: "photos", label: "Photos" },
];

// SAFETY: VERIFICATION_COPY is a Record<Verification, …>, so its keys are exactly the
// Verification values.
const VERIFICATION_KEYS = Object.keys(VERIFICATION_COPY) as Verification[];

const EditorialPolicy = () => (
  <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumbs
          align="start"
          items={[{ href: "/about", label: "About" }, { label: "Editorial policy" }]}
        />
        <h1 className="font-serif text-4xl font-bold lg:text-5xl">Editorial policy</h1>
        <p className="text-muted-foreground text-lg">
          Who we include, what counts as evidence, and how records are corrected.
        </p>
      </div>

      <nav aria-label="On this page" className="flex flex-wrap gap-1.5">
        {SECTIONS.map((section) => (
          <a
            className="rounded-full border border-black/12 bg-white/60 px-3 py-1 text-sm hover:border-black/30"
            href={`#${section.id}`}
            key={section.id}
          >
            {section.label}
          </a>
        ))}
      </nav>

      <section className="flex scroll-mt-24 flex-col gap-3" id="who">
        <h2 className="font-serif text-3xl font-semibold">Who we include</h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white/55 p-4">
            <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Alumni
            </span>
            <p className="text-sm">
              People who attended a Montessori school or program, at any age, and went on to do
              great things. Parents, guides, and supporters aren&apos;t alumni, though they may be
              contributors.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white/55 p-4">
            <span className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
              Contributors
            </span>
            <p className="text-sm">
              People whose research, scholarship, or published work shaped Montessori pedagogy or
              the field: researchers, philosophers, authors, founders, and trainers. Teaching alone
              isn&apos;t enough; at least one documented contribution is required. Someone can be
              both.
            </p>
          </div>
        </div>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="evidence">
        <h2 className="font-serif text-3xl font-semibold">What counts as evidence</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm">
          <li>Library authority records and the person&apos;s own publications</li>
          <li>
            Reliable published sources: interviews, articles, official biographies, school pages
          </li>
          <li>Wikipedia, when the article itself mentions Montessori</li>
          <li>The person&apos;s own posts and pages</li>
          <li>Personal knowledge, recorded as such</li>
        </ol>
        <p className="text-sm text-[#4A433D]">
          Unsourced &quot;famous Montessori alumni&quot; lists aren&apos;t evidence on their own.
          Many repeat each other, and several confuse parents or supporters with alumni.
        </p>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="verification">
        <h2 className="font-serif text-3xl font-semibold">Verification</h2>
        <dl className="overflow-hidden rounded-xl border border-black/10 bg-white/55">
          {VERIFICATION_KEYS.map((key) => (
            <div
              className="grid gap-1 border-b border-black/7 px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[7.5rem_1fr] sm:gap-3"
              key={key}
            >
              <dt className="font-semibold">{VERIFICATION_COPY[key].label}</dt>
              <dd className="text-[#4A433D]">{VERIFICATION_COPY[key].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="corrections">
        <h2 className="font-serif text-3xl font-semibold">Corrections and removals</h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            <b>Corrections</b> are made directly in the record.
          </li>
          <li>
            <b>Duplicates</b> are merged. The old identifier keeps working and points to the
            surviving record.
          </li>
          <li>
            <b>Removal requests</b> from the person, or their family, are honored. Identifiers are
            never reused.
          </li>
        </ul>
        <Link
          className="self-start rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:border-black/30"
          href={githubIssueUrl("04_correction.yml", {})}
          target="_blank"
        >
          Suggest a correction
        </Link>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="photos">
        <h2 className="font-serif text-3xl font-semibold">Photos</h2>
        <p className="text-sm">
          The data is dedicated to the public domain under CC0, but profile photos come from many
          places and keep their original terms. Credits appear on each profile where we know them;
          photographers can ask for a credit or a removal.
        </p>
      </section>

      <p className="text-muted-foreground text-sm">
        The technical side — permanent identifiers, merges, and linked data — is in{" "}
        <Link className="underline" href={`${REPO_URL}/blob/main/docs/authority.md`}>
          docs/authority.md
        </Link>
        .
      </p>
    </div>
  </div>
);
export default EditorialPolicy;
