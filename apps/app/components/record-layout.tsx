import type { ReactNode } from "react";

/**
 * Profile and organization pages: a 45rem (720px) reading column on the left
 * and a 280px rail on the right, 40px apart, inside the wide shell. Below lg
 * the rail stacks under the main column.
 *
 * In print, the record's permanent link is written out under the main column.
 */
export const RecordLayout = ({
  main,
  rail,
  permanentUrl,
}: {
  main: ReactNode;
  rail: ReactNode;
  permanentUrl: string;
}) => (
  <div className="grid gap-12 lg:grid-cols-[minmax(0,45rem)_280px] lg:justify-between lg:gap-10">
    <article className="flex min-w-0 flex-col gap-9">
      {main}
      <p className="hidden text-sm print:block">
        Permanent link: <span className="font-mono">{permanentUrl}</span>
      </p>
    </article>
    {rail}
  </div>
);
