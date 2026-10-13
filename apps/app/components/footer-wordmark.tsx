"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const WORDMARK = "the montessorians";

/**
 * The footer's full-width wordmark. Its letters rise into place, one after
 * another, the first time the footer scrolls into view. Reduced-motion
 * visitors get it static.
 */
export const FooterWordmark = () => {
  const ref = useRef<HTMLAnchorElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      aria-label="The Montessorians home"
      className="group block overflow-hidden font-serif text-[min(14vw,10.8rem)] leading-[0.82] tracking-[-0.02em] whitespace-nowrap text-white/95 select-none focus-visible:-outline-offset-2"
      href="/"
      ref={ref}
    >
      {[...WORDMARK].map((letter, index) => (
        <span
          aria-hidden="true"
          className="inline-block translate-y-[0.6em] opacity-0 transition-[transform,opacity,color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-white data-[shown=true]:translate-y-0 data-[shown=true]:opacity-100 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none"
          data-shown={shown}
          // Letters are fixed, so their positions are stable keys.
          // oxlint-disable-next-line react/no-array-index-key -- the wordmark's letters never reorder
          key={index}
          style={{ transitionDelay: `${index * 28}ms` }}
        >
          {letter === " " ? "\u00A0" : letter}
        </span>
      ))}
    </Link>
  );
};
