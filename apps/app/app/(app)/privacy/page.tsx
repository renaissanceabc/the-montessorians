import Link from "next/link";

import { Breadcrumbs } from "@/components/breadcrumbs";
import { createMetadata } from "@/lib/metadata";
import { githubIssueUrl, REPO_URL } from "@/lib/url";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/privacy`,
    },
    description:
      "What The Montessorians collects when you browse or suggest a profile, where it goes, and how to ask for a correction or removal.",
    title: "Privacy",
  });

const SECTIONS = [
  { id: "contribute", label: "Suggesting a profile" },
  { id: "analytics", label: "Analytics" },
  { id: "errors", label: "Error reports" },
  { id: "people", label: "People in the directory" },
  { id: "contact", label: "Contact" },
];

const linkClass = "underline underline-offset-2";

const Privacy = () => (
  <div className="container mx-auto max-w-3xl px-4 pt-12 pb-16 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumbs
          align="start"
          items={[{ href: "/about", label: "About" }, { label: "Privacy" }]}
        />
        <h1 className="font-serif text-4xl font-bold lg:text-5xl">Privacy</h1>
        <p className="text-muted-foreground text-lg">
          The short version: there are no accounts, we don&apos;t sell or share data, and anything
          you submit becomes public.
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

      <section className="flex scroll-mt-24 flex-col gap-3" id="contribute">
        <h2 className="font-serif text-3xl font-semibold">Suggesting a profile</h2>
        <p className="text-sm">
          The{" "}
          <Link className={linkClass} href="/contribute">
            contribute form
          </Link>{" "}
          collects only what you type about the person you&apos;re suggesting: their name, tagline,
          tags, sources, links, and the other fields on the form. It doesn&apos;t ask who you are.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            <b>Submissions are public.</b> Each one becomes an issue on the project&apos;s{" "}
            <Link className={linkClass} href={`${REPO_URL}/issues`} target="_blank">
              public GitHub repository
            </Link>
            , where anyone can read it. Don&apos;t include anything you wouldn&apos;t post publicly.
          </li>
          <li>
            Maintainers review each issue. Only what they accept is added to the dataset, which is
            published under CC0.
          </li>
          <li>
            To stop abuse, the form runs an invisible bot check (Vercel BotID), and your IP address
            is used, briefly and in memory, to limit how many submissions can come from one place.
            It isn&apos;t stored with the submission.
          </li>
          <li>
            If you open the request on GitHub instead, GitHub&apos;s own privacy terms apply and the
            issue shows your GitHub account.
          </li>
        </ul>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="analytics">
        <h2 className="font-serif text-3xl font-semibold">Analytics</h2>
        <p className="text-sm">
          We count visits to see which pages are useful. There are no accounts and no advertising,
          and we don&apos;t sell or share this data.
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm">
          <li>
            <b>Vercel Web Analytics</b> counts page views without cookies.
          </li>
          <li>
            <b>PostHog</b> records page views, page exits, and clicks, routed through this
            site&apos;s own domain. Visitors are anonymous; we never identify you by name or email.
          </li>
        </ul>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="errors">
        <h2 className="font-serif text-3xl font-semibold">Error reports</h2>
        <p className="text-sm">
          When error monitoring is switched on, crashes are reported to Sentry so we can fix them. A
          report includes the page, your browser, and what went wrong. Session replays attached to
          errors mask all text and block images, so they don&apos;t show what you typed.
        </p>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="people">
        <h2 className="font-serif text-3xl font-semibold">People in the directory</h2>
        <p className="text-sm">
          Profiles are built from published sources, as set out in the{" "}
          <Link className={linkClass} href="/about/editorial-policy">
            editorial policy
          </Link>
          . If you&apos;re in the directory, or represent someone who is, you can ask for a
          correction or a removal; removal requests from the person or their family are honored. See{" "}
          <Link className={linkClass} href="/about/editorial-policy#corrections">
            corrections and removals
          </Link>
          .
        </p>
        <Link
          className="self-start rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-medium hover:border-black/30"
          href={githubIssueUrl("04_correction.yml", {})}
          target="_blank"
        >
          Request a correction or removal
        </Link>
      </section>

      <section className="flex scroll-mt-24 flex-col gap-3" id="contact">
        <h2 className="font-serif text-3xl font-semibold">Contact</h2>
        <p className="text-sm">
          For anything about privacy, open an issue on{" "}
          <Link className={linkClass} href={`${REPO_URL}/issues/new/choose`} target="_blank">
            GitHub
          </Link>
          . If it&apos;s something you&apos;d rather not post publicly, say so in a short issue
          without the details and a maintainer will follow up privately.
        </p>
      </section>
    </div>
  </div>
);
export default Privacy;
