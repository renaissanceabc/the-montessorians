import { notFound } from "next/navigation";
import { createMetadata } from "@/lib/metadata";
import { DEFAULT_PROFILES_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { TagProfilesPageWrapper } from "./components/tag-profiles-page-wrapper";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = await getQueryClient().fetchQuery(trpc.tags.bySlug.queryOptions({ slug }));

  if (!tag) {
    return {};
  }

  return createMetadata({
    title: tag.label,
    description: `Explore Montessorians tagged with "${tag.label}".`,
    alternates: {
      canonical: `${siteUrl}/tags/${tag.slug}`,
    },
  });
}

type TagPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function TagPage(props: TagPageProps) {
  const { slug } = await props.params;
  const qc = getQueryClient();
  const tag = await qc.fetchQuery(trpc.tags.bySlug.queryOptions({ slug }));

  if (!tag) {
    notFound();
  }

  const { orderBy, sortBy } = await props.searchParams;

  const filters = {
    ...DEFAULT_PROFILES_FILTERS,
    orderBy:
      (orderBy as typeof DEFAULT_PROFILES_FILTERS.orderBy) || DEFAULT_PROFILES_FILTERS.orderBy,
    sortBy: (sortBy as typeof DEFAULT_PROFILES_FILTERS.sortBy) || DEFAULT_PROFILES_FILTERS.sortBy,
    tags: slug,
  };

  await qc.prefetchInfiniteQuery(
    trpc.profiles.list.infiniteQueryOptions(filters, {
      initialCursor: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    })
  );

  return (
    <HydrateClient>
      <TagProfilesPageWrapper initialFilters={filters} tag={tag} />
    </HydrateClient>
  );
}
