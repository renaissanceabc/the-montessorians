import { cacheLife, cacheTag } from "next/cache";
import { Suspense } from "react";
import { createMetadata } from "@/lib/metadata";
import { siteUrl } from "@/lib/utils";
import { getQueryClient, HydrateClient, trpc } from "@/trpc/server";
import { PastProfilesPageWrapper } from "./components/profiles-page-wrapper";

export const generateMetadata = () => {
  return createMetadata({
    title: "Archive",
    description: "Archive of Montessorians.",
    alternates: {
      canonical: `${siteUrl}/archive`,
    },
  });
};

export default async function Archive() {
  "use cache";
  cacheTag("profiles", "past-profiles");
  cacheLife("days");

  const qc = getQueryClient();
  await qc.prefetchInfiniteQuery(
    trpc.profiles.past.infiniteQueryOptions(
      {},
      {
        initialCursor: 1,
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      }
    )
  );

  return (
    <HydrateClient>
      <Suspense>
        <PastProfilesPageWrapper />
      </Suspense>
    </HydrateClient>
  );
}
