import { ChevronDownIcon, PencilIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { CopyButton } from "@/components/copy-button";
import { formatCitation } from "@/lib/citation";

export interface RecordIdentifier {
  label: string;
  value: string;
  url: string;
}

interface RecordProps {
  /** The record's own id, such as tm0000067 */
  id: string;
  /** Its permanent link, https://…/id/tm0000067 */
  permanentUrl: string;
  /** The name to cite it by: the authorized form where there is one */
  heading: string;
  /** Other forms of the name, such as birth and married names */
  alsoKnownAs?: string[];
  /** Identifiers in other authorities */
  identifiers: RecordIdentifier[];
  /** Anything else about the record, under the identifiers */
  children?: ReactNode;
}

/** The permanent link (host truncated, id kept), a copy button, the identifiers, and a citation. */
const MAX_ALSO_KNOWN_AS = 4;

/** Name variants worth showing: each once, leaving out the names already on the page. */
export const otherNames = (
  variants: string[] | undefined,
  shown: (string | null | undefined)[]
): string[] => {
  const seen = new Set(shown.filter(Boolean).map((name) => name?.toLowerCase()));
  return (variants ?? []).filter((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const RecordContent = ({
  id,
  permanentUrl,
  heading,
  alsoKnownAs,
  identifiers,
  children,
}: RecordProps) => {
  const citation = formatCitation({ heading, id, permanentUrl });
  const display = permanentUrl.replace(/^https?:\/\//u, "");
  const tail = `/id/${id}`;
  const host = display.endsWith(tail) ? display.slice(0, -tail.length) : display;
  return (
    <div className="flex flex-col gap-3">
      <div className="-my-1 flex min-w-0 items-center gap-1">
        <Link
          className="flex min-w-0 flex-1 font-mono text-xs text-[#4A433D] underline decoration-black/20 underline-offset-[3px] hover:decoration-current"
          href={permanentUrl}
          title={display}
        >
          <span className="truncate">{host}</span>
          {host !== display && <span className="shrink-0">{tail}</span>}
        </Link>
        <CopyButton className="-mr-1.5" label="permanent link" text={permanentUrl} />
      </div>
      {alsoKnownAs && alsoKnownAs.length > 0 && (
        <p className="border-t border-black/7 pt-2 text-xs break-words text-[#4A433D]">
          <span className="text-muted-foreground">Also known as </span>
          {alsoKnownAs.slice(0, MAX_ALSO_KNOWN_AS).join("; ")}
        </p>
      )}
      {identifiers.length > 0 && (
        <dl aria-label="Identifiers" className="flex flex-col border-t border-black/7 pt-2 text-xs">
          {identifiers.map((identifier) => (
            <div
              className="flex min-w-0 items-baseline justify-between gap-3 py-1"
              key={identifier.label}
            >
              <dt className="text-muted-foreground shrink-0">{identifier.label}</dt>
              <dd className="min-w-0">
                <Link
                  className="block truncate font-mono hover:underline"
                  href={identifier.url}
                  rel="noopener"
                  target="_blank"
                  title={identifier.value}
                >
                  {identifier.value}
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      )}
      <div className="flex min-w-0 items-start gap-1 border-t border-black/7 pt-2">
        <p className="min-w-0 flex-1 text-xs break-words text-[#4A433D]">
          <span className="text-muted-foreground">Cite as </span>
          {citation}
        </p>
        <CopyButton citation className="-mt-1.5 -mr-1.5" label="citation" text={citation} />
      </div>
      {children}
    </div>
  );
};

/**
 * The record's permanent link and identifiers. Large screens (and print) show it
 * as a quiet box; on phones it folds into a "Record details" row.
 */
export const RecordDetails = (props: RecordProps) => {
  const { id, identifiers } = props;
  const summary = [
    `ID ${id}`,
    identifiers.length > 0 &&
      `${identifiers.length} identifier${identifiers.length === 1 ? "" : "s"}`,
    "cite",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <section
        aria-labelledby={`record-${id}`}
        className="hidden flex-col gap-2.5 rounded-xl border border-black/8 p-4 lg:flex print:flex"
      >
        <h2 className="type-eyebrow" id={`record-${id}`}>
          Record
        </h2>
        <RecordContent {...props} />
      </section>

      <details className="group rounded-xl border border-black/8 lg:hidden print:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl p-4 [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-sm font-medium">Record details</span>
            <span className="text-muted-foreground truncate text-xs">{summary}</span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 ease-out group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="px-4 pb-4">
          <RecordContent {...props} />
        </div>
      </details>
    </>
  );
};

/** The full-width "Suggest a correction" button at the foot of a record's rail. */
export const CorrectionButton = ({ href }: { href: string }) => (
  <Link
    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-black/15 bg-white/60 px-3 text-sm font-medium transition-colors hover:border-black/30 hover:bg-white"
    data-print-hidden
    href={href}
    rel="noopener"
    target="_blank"
  >
    <PencilIcon aria-hidden="true" className="text-muted-foreground size-3.5" />
    Suggest a correction
  </Link>
);
