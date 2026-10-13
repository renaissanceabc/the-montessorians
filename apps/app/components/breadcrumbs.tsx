import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

import { cn, siteUrl } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

/** The last crumb that links somewhere: the parent page. */
const lastLinked = (items: Crumb[]): Crumb | null => {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (items[i].href) {
      return items[i];
    }
  }
  return null;
};

/**
 * Site-wide breadcrumbs: muted links separated by chevrons, the current page
 * last and unlinked. On phones it collapses to "‹ Parent". Also emits a
 * schema.org BreadcrumbList so search engines can show the trail.
 */
export const Breadcrumbs = ({
  items,
  align = "center",
  className,
}: {
  items: Crumb[];
  align?: "center" | "start";
  className?: string;
}) => {
  const parent = lastLinked(items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      item: item.href ? `${siteUrl}${item.href}` : undefined,
      name: item.label,
      position: i + 1,
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("w-full text-sm", className)}>
        <ol
          className={cn(
            "hidden items-center gap-1.5 sm:flex",
            align === "center" ? "justify-center" : "justify-start"
          )}
        >
          {items.map((item, i) => (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && (
                <li aria-hidden="true" className="text-muted-foreground/60">
                  <ChevronRightIcon className="size-3.5" />
                </li>
              )}
              <li className="min-w-0">
                {item.href ? (
                  <Link
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground block truncate font-medium">
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
        {parent?.href && (
          <Link
            className={cn(
              "text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors sm:hidden",
              align === "center" ? "justify-center" : "justify-start"
            )}
            href={parent.href}
          >
            <ChevronLeftIcon className="size-4" />
            {parent.label}
          </Link>
        )}
      </nav>
      <script
        // oxlint-disable-next-line react/no-danger -- JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
        type="application/ld+json"
      />
    </>
  );
};
