"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Container } from "./container";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About" },
];

const Header = () => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className="sticky top-2 z-100 my-2 w-full sm:top-4 sm:my-4 lg:top-8 lg:my-8"
      data-print-hidden
    >
      <Container>
        {/* The pill reaches past the content edge by its own padding, so the logo
            and the links sit exactly on the page's content edge. */}
        <div
          className={cn(
            "-mx-3 flex flex-row items-center justify-between gap-3 rounded-full px-3 py-3 transition-colors duration-200 ease-out sm:-mx-5 sm:gap-4 sm:px-5 sm:py-4 lg:-mx-8 lg:px-8 lg:py-6",
            isSticky ? "bg-black/7 backdrop-blur-lg" : "bg-transparent"
          )}
        >
          <Link
            className="hover:text-primary min-w-0 font-serif text-[clamp(1rem,5.8vw,1.5rem)] font-semibold whitespace-nowrap transition-colors md:text-3xl lg:text-4xl"
            href="/"
          >
            the montessorians
          </Link>

          <nav aria-label="Main" className="flex h-5 shrink-0 items-center gap-3 sm:gap-4 lg:gap-6">
            {links.map((link) => (
              <Link
                className="flex flex-row items-center gap-2 text-sm font-semibold transition-colors hover:underline sm:text-base"
                href={link.href}
                key={link.label}
              >
                {link.label}
              </Link>
            ))}
            <Link
              className="hidden rounded-md border border-black/20 px-3 py-1.5 text-base font-semibold transition-colors hover:border-black/50 hover:bg-white/50 sm:flex"
              href="/contribute"
            >
              Contribute
            </Link>
          </nav>
        </div>
      </Container>
    </header>
  );
};

export default Header;
