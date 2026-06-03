"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, SearchXIcon } from "lucide-react";
import { useEffect, useRef } from "react";
import ProfileListItem from "@/components/profile-list-item";
import { useTRPC } from "@/trpc/client";

type Filters = {
  orderBy?: string;
  sortBy?: string;
  search?: string;
  tags?: string;
};

export default function ProfilesPaginatedList({ filters }: { filters: Filters }) {
  const trpc = useTRPC();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    ...trpc.profiles.list.infiniteQueryOptions(filters, {
      initialCursor: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    }),
    placeholderData: keepPreviousData,
  });

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

  const profiles = data?.pages.flatMap((page) => page.data) ?? [];

  if (!(profiles.length || isFetchingNextPage)) {
    const isSearchActive = Boolean(filters.search);
    return (
      <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground text-sm italic">
        <SearchXIcon className="h-16 w-16" />
        {isSearchActive
          ? "No Montessorians found. Try a different search."
          : "No Montessorians yet. Check back soon."}
      </div>
    );
  }

  return (
    <div className="flex min-h-[500px] w-full flex-col gap-2">
      {profiles.map((profile) => (
        <ProfileListItem key={profile.slug} profile={profile} />
      ))}

      {hasNextPage && (
        <div className="flex items-center justify-center gap-2 py-4 text-center" ref={loadMoreRef}>
          {isFetchingNextPage && <Loader2 className="h-8 w-8 animate-spin" />}
        </div>
      )}
    </div>
  );
}
