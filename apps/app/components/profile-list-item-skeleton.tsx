"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Stable keys for the three placeholder tag badges. */
const PLACEHOLDER_TAGS = ["tag-1", "tag-2", "tag-3"];

const ProfileListItemSkeleton = () => (
  <div className="flex gap-4 rounded-lg border border-transparent p-4 transition-all duration-150">
    <div className="h-16 w-16 shrink-0 overflow-hidden sm:h-24 sm:w-24">
      <Skeleton className="h-full w-full rounded-full bg-black/10" />
    </div>

    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-1">
        <Skeleton className="h-5 w-3/4 rounded bg-black/10" />
        <Skeleton className="h-3 w-full rounded bg-black/10" />
      </div>

      {/* Tag badges */}
      <div className="flex flex-wrap gap-1 pt-1 sm:gap-2">
        {PLACEHOLDER_TAGS.map((key) => (
          <Skeleton className="h-5 w-12 rounded-full bg-black/10" key={key} />
        ))}
      </div>
    </div>
  </div>
);

export default ProfileListItemSkeleton;
