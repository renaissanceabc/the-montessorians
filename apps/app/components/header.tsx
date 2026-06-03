"use client";

import clsx from "clsx";
import { useScroll } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GitHubIcon } from "@/components/icons";

const links = [
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const { scrollY } = useScroll();
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    return scrollY.onChange((y) => {
      setIsSticky(y > 24);
    });
  }, [scrollY]);

  return (
    <header className="sticky top-2 z-100 w-full px-3 sm:top-4 sm:my-4 sm:px-4 lg:top-8 lg:my-8 lg:px-8">
      <div
        className={clsx(
          "container mx-auto flex max-w-screen-md flex-row items-center justify-between gap-3 rounded-full border border-transparent px-6 py-3 backdrop-blur-lg transition-colors duration-300 sm:gap-4 sm:py-4 lg:px-8 lg:py-6",
          {
            "bg-black/7": isSticky,
            "bg-transparent": !isSticky,
          }
        )}
      >
        <Link
          className="font-semibold font-serif text-2xl transition-colors hover:text-primary md:text-3xl lg:text-4xl"
          href="/"
        >
          the montessorians
        </Link>

        <div className="flex h-5 items-center gap-3 sm:gap-4 lg:gap-6">
          {links.map((link) => (
            <Link
              className="flex flex-row items-center gap-2 font-semibold text-sm transition-colors hover:underline sm:text-base"
              href={link.href}
              key={link.label}
            >
              {link.label}
            </Link>
          ))}
          <Link
            className="hidden flex-row items-center gap-2 font-semibold text-base transition-colors hover:underline sm:flex"
            href="https://github.com/renaissanceabc/the-montessorians"
            rel="noopener noreferrer"
            target="_blank"
          >
            <GitHubIcon className="h-4 w-4" />
            Contribute
          </Link>
        </div>
      </div>
    </header>
  );
}
