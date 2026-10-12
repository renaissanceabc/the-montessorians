import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import type { Verification } from "@/lib/content/types";
import { VERIFICATION_COPY } from "@/lib/content/verification";
import { createMetadata } from "@/lib/metadata";
import { githubIssueUrl, REPO_URL } from "@/lib/url";
import { siteUrl } from "@/lib/utils";

// The site version of docs/editorial-policy.md — keep the two in step.

export const generateMetadata = () => {
  return createMetadata({
    title: "Editorial policy",
    description:
      "Who The Montessorians includes, what counts as evidence, and how records are corrected.",
    alternates: {
      canonical: `${siteUrl}/about/editorial-policy`,
    },
  });
};

const SECTIONS = [
  { id: "who", label: "Who we include" },
  { id: "evidence", label: "Evidence" },
  { id: "verification", label: "Verification" },
  { id: "corrections", label: "Corrections and removals" },
  { id: "photos", label: "Photos" },
];

export default function EditorialPolicy() {
  return (
    <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Breadcrumbs
            align="start"
            items={[{ label: "About", href: "/about" }, { label: "Editorial policy" }]}
          />
          <h1 className="font-bold font-serif text-4xl lg:text-5xl">Editorial policy</h1>
          <p className="text-lg text-muted-foreground">
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
          <h2 className="font-semibold font-serif text-3xl">Who we include</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white/55 p-4">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                Alumni
              </span>
              <p className="text-sm">
                People who attended a Montessori school or program, at any age, and went on to do
                great things. Parents, guides, and supporters aren't alumni, though they may be
                contributors.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 rounded-xl border border-black/10 bg-white/55 p-4">
              <span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
                Contributors
              </span>
              <p className="text-sm">
                People whose research, scholarship, or published work shaped Montessori pedagogy or
                the field: researchers, philosophers, authors, founders, and trainers. Teaching
                alone isn't enough; at least one documented contribution is required. Someone can be
                both.
              </p>
            </div>
          </div>
        </section>

        <section className="flex scroll-mt-24 flex-col gap-3" id="evidence">
          <h2 className="font-semibold font-serif text-3xl">What counts as evidence</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            <li>Library authority records and the person's own publications</li>
            <li>
              Reliable published sources: interviews, articles, official biographies, school pages
            </li>
            <li>Wikipedia, when the article itself mentions Montessori</li>
            <li>The person's own posts and pages</li>
            <li>Personal knowledge, recorded as such</li>
          </ol>
          <p className="text-[#4A433D] text-sm">
            Unsourced "famous Montessori alumni" lists aren't evidence on their own. Many repeat
            each other, and several confuse parents or supporters with alumni.
          </p>
        </section>

        <section className="flex scroll-mt-24 flex-col gap-3" id="verification">
          <h2 className="font-semibold font-serif text-3xl">Verification</h2>
          <dl className="overflow-hidden rounded-xl border border-black/10 bg-white/55">
            {(Object.keys(VERIFICATION_COPY) as Verification[]).map((key) => (
              <div
                className="grid gap-1 border-black/7 sm:grid-cols-[7.5rem_1fr] sm:gap-3 border-b px-4 py-3 text-sm last:border-b-0"
                key={key}
              >
                <dt className="font-semibold">{VERIFICATION_COPY[key].label}</dt>
                <dd className="text-[#4A433D]">{VERIFICATION_COPY[key].description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="flex scroll-mt-24 flex-col gap-3" id="corrections">
          <h2 className="font-semibold font-serif text-3xl">Corrections and removals</h2>
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
            className="self-start rounded-md border border-black/15 bg-white px-4 py-2 font-medium text-sm hover:border-black/30"
            href={githubIssueUrl("04_correction.yml", {})}
            target="_blank"
          >
            Suggest a correction
          </Link>
        </section>

        <section className="flex scroll-mt-24 flex-col gap-3" id="photos">
          <h2 className="font-semibold font-serif text-3xl">Photos</h2>
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
}
