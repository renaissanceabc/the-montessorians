import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, trpc } from "@/trpc/server";

export const generateMetadata = () => {
  return createMetadata({
    title: "Tags",
    description:
      "Browse Montessorians by tag. Explore categories like entrepreneurs, educators, activists, and more.",
    alternates: {
      canonical: `${siteUrl}/tags`,
    },
  });
};

export default async function TagsPage() {
  "use cache";
  cacheTag("tags", "profiles");
  cacheLife("days");

  const { data: tags } = await getQueryClient().fetchQuery(
    trpc.tags.listWithCounts.queryOptions(DEFAULT_TAGS_FILTERS)
  );

  return (
    <div className="container mx-auto max-w-screen-md items-center justify-between gap-10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full space-y-8">
        <h1 className="flex w-full justify-center font-bold font-serif text-4xl lg:text-5xl">
          Tags
        </h1>

        <div className="flex flex-wrap justify-center gap-2">
          {tags.length === 0 && <p className="text-muted-foreground">No tags found.</p>}
          {tags.map((tag) => (
            <Link href={`/tags/${tag.slug}`} key={tag.slug}>
              <Badge
                className="group cursor-pointer bg-white/50 px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                variant="outline"
              >
                {tag.label}
                <span className="ml-1.5 text-muted-foreground group-hover:text-primary-foreground">
                  {tag.profileCount}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
