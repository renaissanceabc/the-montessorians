import { ArrowUpRightIcon } from "lucide-react";
import Link from "next/link";

import { REPO_URL } from "@/lib/url";

import { Container } from "./container";
import { FooterWordmark } from "./footer-wordmark";

const GROUPS = [
  {
    links: [
      { href: "/discover", label: "Discover" },
      { href: "/alumni", label: "Alumni" },
      { href: "/contributors", label: "Contributors" },
      { href: "/organizations", label: "Organizations" },
      { href: "/tags", label: "Tags" },
      { href: "/archive", label: "Archive" },
    ],
    title: "Explore",
  },
  {
    links: [
      { href: "/contribute", label: "Add a Montessorian" },
      { href: `${REPO_URL}/issues/new/choose`, label: "Suggest a correction" },
      { href: "/about/editorial-policy", label: "Editorial policy" },
      { href: REPO_URL, label: "GitHub" },
    ],
    title: "Contribute",
  },
  {
    links: [
      { href: "/data", label: "Data & API" },
      { href: "/data#permanent-identifiers", label: "Permanent IDs" },
      { href: "/data#reconciliation-api", label: "Reconciliation API" },
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
    ],
    title: "Data",
  },
];

const isExternal = (href: string) => href.startsWith("http");

const Footer = () => (
  <footer
    className="bg-primary flex w-full flex-col overflow-hidden text-white [&_a:focus-visible]:outline-white"
    data-print-hidden
  >
    <Container className="flex flex-col gap-12 pt-14">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <p className="type-section max-w-sm font-normal text-white/90">
          People shaped by Montessori, <em>and the people who shaped it.</em>
        </p>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 sm:gap-x-12 lg:gap-x-16">
          {GROUPS.map((group) => (
            <nav aria-label={group.title} className="flex flex-col gap-3" key={group.title}>
              <span className="type-eyebrow text-white/70">{group.title}</span>
              {group.links.map((link) => (
                <Link
                  className="w-fit text-sm text-white/75 transition-colors hover:text-white hover:underline"
                  href={link.href}
                  key={link.href}
                  {...(isExternal(link.href) ? { rel: "noopener", target: "_blank" } : {})}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-white/14 pt-5 text-[13px] text-white/70 sm:flex-row sm:items-center sm:justify-between">
        <span>Data dedicated to the public domain (CC0). Code open source.</span>
        <Link
          className="inline-flex w-fit items-center gap-1.5 text-white/75 transition-colors hover:text-white"
          href="https://renaissance.education?utm_source=the_montessorians&utm_medium=footer"
          rel="noopener"
          target="_blank"
        >
          Made by Renaissance
          <ArrowUpRightIcon className="size-3" />
        </Link>
      </div>

      <FooterWordmark />
    </Container>
  </footer>
);

export default Footer;
