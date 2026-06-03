import { createMetadata } from "@/lib/metadata";
import { DEFAULT_PROFILES_FILTERS, DEFAULT_TAGS_FILTERS } from "@/lib/types";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { ProfilesPageWrapper } from "./components/profiles-page-wrapper";

export const generateMetadata = () => {
  return createMetadata({
    title: "Explore the Directory",
    description:
      "Explore the directory of Montessorians, including educators, activists, and innovators.",
    alternates: {
      canonical: `${siteUrl}/discover`,
    },
  });
};

type DiscoverSearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function Profiles(props: { searchParams: DiscoverSearchParams }) {
  const { q, orderBy, sortBy, tags } = await props.searchParams;

  const filters = {
    ...DEFAULT_PROFILES_FILTERS,
    search: q as string | undefined,
    orderBy:
      (orderBy as typeof DEFAULT_PROFILES_FILTERS.orderBy) || DEFAULT_PROFILES_FILTERS.orderBy,
    sortBy: (sortBy as typeof DEFAULT_PROFILES_FILTERS.sortBy) || DEFAULT_PROFILES_FILTERS.sortBy,
    tags: (tags as string) || undefined,
  };

  const qc = getQueryClient();
  await Promise.all([
    qc.prefetchInfiniteQuery(
      trpc.profiles.list.infiniteQueryOptions(filters, {
        initialCursor: 1,
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      })
    ),
    qc.prefetchQuery(trpc.tags.list.queryOptions(DEFAULT_TAGS_FILTERS)),
  ]);

  return (
    <HydrateClient>
      <ProfilesPageWrapper initialFilters={filters} />
    </HydrateClient>
  );
}
