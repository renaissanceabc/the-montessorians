"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import ProfileListItem from "@/components/profile-list-item";
import { useTRPC } from "@/trpc/client";

export default function PastProfilesPaginatedList() {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    trpc.profiles.past.infiniteQueryOptions(
      {},
      {
        initialCursor: 1,
        getNextPageParam: (lastPage) =>
          lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
      }
    )
  );

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!(hasNextPage && loadMoreRef.current)) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        fetchNextPage();
      }
    });

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const profiles = data.pages.flatMap((page) => page.data);

  if (!(profiles.length || isFetchingNextPage)) {
    return (
      <div className="text-muted-foreground text-sm italic">
        No Montessorians yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      {profiles.map((profile) => (
        <div className="flex flex-col gap-2" key={profile.slug}>
          <div className="relative flex items-center justify-center">
            <div className="-z-10 absolute top-1/2 left-0 w-full border-black/10 border-t" />
            <span className="z-10 bg-background px-3 text-center text-muted-foreground text-sm">
              {format(parseISO(profile.featuredDate), "MMMM d, yyyy")}
            </span>
          </div>

          <ProfileListItem profile={profile} />
        </div>
      ))}

      {hasNextPage && (
        <div className="flex items-center justify-center gap-2 py-4 text-center" ref={loadMoreRef}>
          {isFetchingNextPage && <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
      )}
    </div>
  );
}
