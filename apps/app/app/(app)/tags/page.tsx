import Link from "next/link";

import { Container } from "@/components/container";
import { getTagsWithCounts } from "@/lib/content/profiles";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";

export const generateMetadata = () =>
  createMetadata({
    alternates: {
      canonical: `${siteUrl}/tags`,
    },
    description:
      "Browse Montessorians by tag. Explore categories like entrepreneurs, educators, activists, and more.",
    title: "Tags",
  });

const TagsPage = () => {
  const { data: tags } = getTagsWithCounts(DEFAULT_TAGS_FILTERS);

  return (
    <Container className="flex flex-col gap-8 pt-6 pb-16 lg:pt-8">
      <div className="flex max-w-2xl flex-col gap-2">
        <h1 className="type-title">Tags</h1>
        <p className="type-lead">Browse Montessorians by what they do.</p>
      </div>

      {tags.length === 0 ? (
        <p className="text-muted-foreground">No tags found.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li key={tag.slug}>
              <Link
                className="group hover:bg-primary hover:text-primary-foreground inline-flex h-8 items-center rounded-full border border-black/12 bg-white/50 px-3 text-sm transition-colors hover:border-transparent"
                href={`/tags/${tag.slug}`}
              >
                {tag.label}
                <span className="text-muted-foreground group-hover:text-primary-foreground ml-1.5 tabular-nums">
                  {tag.profileCount}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
};
export default TagsPage;
