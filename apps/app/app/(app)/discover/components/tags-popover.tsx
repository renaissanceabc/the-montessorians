"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTRPC } from "@/trpc/client";
import type { Tag } from "@/trpc/types";
import { TagsPopoverContent } from "./tags-popover-content";

export function TagsPopover({
  initialTags,
  onApplyTags,
}: {
  initialTags: string;
  onApplyTags: (tagSlugs: string) => void;
}) {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.tags.list.queryOptions({ orderBy: "alphabetical", sortBy: "asc" })
  );

  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [appliedTags, setAppliedTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);

  const tagSlugs = useMemo(() => initialTags.split(",").filter(Boolean), [initialTags]);

  useEffect(() => {
    if (!data) return;
    const tagMap = new Map(data.data.map((tag) => [tag.slug, tag]));
    const matchingTags = tagSlugs
      .map((slug) => tagMap.get(slug))
      .filter((tag): tag is Tag => !!tag);
    setSelectedTags(matchingTags);
    setAppliedTags(matchingTags);
  }, [data, tagSlugs]);

  return (
    <TagsPopoverContent
      appliedTags={appliedTags}
      availableTags={data?.data ?? []}
      open={open}
      selectedTags={selectedTags}
      setAppliedTags={setAppliedTags}
      setOpen={setOpen}
      setSelectedTags={setSelectedTags}
      setTagsQueryParam={(newTagSlugs) => {
        onApplyTags(newTagSlugs);
        setOpen(false);
      }}
    />
  );
}
