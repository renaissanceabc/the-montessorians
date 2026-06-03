import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const links = [
  {
    label: "Discover",
    href: "/discover",
  },
  {
    label: "Archive",
    href: "/archive",
  },
  {
    label: "Tags",
    href: "/tags",
  },
  {
    label: "About",
    href: "/about",
  },
];

export default function Footer() {
  return (
    <footer className="flex w-full flex-col bg-primary">
      <div className="container mx-auto flex max-w-3xl flex-col gap-6 p-16">
        <div className="flex flex-col items-center justify-between gap-10 sm:flex-row sm:gap-2">
          <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
            <div className="flex flex-col gap-2">
              <Link
                className="font-semibold font-serif text-3xl text-white transition-colors lg:text-4xl"
                href="/"
              >
                the montessorians
              </Link>

              <p className="text-sm text-white/60">Discover extraordinary Montessori alumni</p>
            </div>

            <Badge
              asChild
              className="flex gap-2 border border-white/20 bg-white/10 text-primary-foreground transition-colors duration-150 [a&]:hover:border-white/25 [a&]:hover:bg-white/18"
            >
              <Link
                href="https://renaissance.education?utm_source=the_montessorians&utm_medium=footer"
                target="_blank"
              >
                Made by Renaissance
              </Link>
            </Badge>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-end sm:gap-2">
            {links.map((link) => (
              <Link
                className="text-sm text-white/75 transition-colors hover:text-white hover:underline"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
