import Link from "next/link";

/** The footer's full-width wordmark, linking home. */
export const FooterWordmark = () => (
  <Link
    aria-label="The Montessorians home"
    className="block overflow-hidden font-serif text-[min(14vw,10.8rem)] leading-[0.82] tracking-[-0.02em] whitespace-nowrap text-white/95 transition-colors select-none hover:text-white focus-visible:-outline-offset-2"
    href="/"
  >
    <span aria-hidden="true">the montessorians</span>
  </Link>
);
