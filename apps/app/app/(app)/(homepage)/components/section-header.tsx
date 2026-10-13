import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

/**
 * The one header style for homepage sections: a serif title, a short muted
 * lead, and a single action link on the right. On phones the action keeps
 * its place on the title's line, with a shorter label.
 */
const SectionHeader = ({
  id,
  title,
  lead,
  href,
  action,
  shortAction,
}: {
  /** Labels the section, e.g. `aria-labelledby` */
  id: string;
  title: string;
  lead: string;
  href: string;
  action: string;
  /** The action's label on phones */
  shortAction: string;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-baseline justify-between gap-4">
      <h2 className="type-section" id={id}>
        {title}
      </h2>
      <Link
        className="text-foreground flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
        href={href}
      >
        <span className="sm:hidden">{shortAction}</span>
        <span className="max-sm:hidden">{action}</span>
        <ArrowRightIcon aria-hidden="true" className="size-4 self-center" />
      </Link>
    </div>
    <p className="text-muted-foreground text-[15px] text-pretty">{lead}</p>
  </div>
);
export default SectionHeader;
