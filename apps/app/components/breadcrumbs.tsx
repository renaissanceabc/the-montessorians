import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { cn, siteUrl } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Site-wide breadcrumbs: muted links separated by chevrons, the current page
 * last and unlinked. On phones it collapses to "‹ Parent". Also emits a
 * schema.org BreadcrumbList so search engines can show the trail.
 */
export function Breadcrumbs({
  items,
  align = "center",
  className,
}: {
  items: Crumb[];
  align?: "center" | "start";
  className?: string;
}) {
  const parent = [...items].reverse().find((item) => item.href);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: item.href ? `${siteUrl}${item.href}` : undefined,
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
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="block truncate font-medium text-foreground">
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
              "flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground sm:hidden",
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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD payload, with `<` escaped to prevent breaking out of the script tag
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        type="application/ld+json"
      />
    </>
  );
}
