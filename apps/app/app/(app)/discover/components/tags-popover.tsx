"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tag } from "@/lib/content/types";
import { TagsPopoverContent } from "./tags-popover-content";

export function TagsPopover({
  initialTags,
  onApplyTags,
  availableTags,
}: {
  initialTags: string;
  onApplyTags: (tagSlugs: string) => void;
  availableTags: Tag[];
}) {
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [appliedTags, setAppliedTags] = useState<Tag[]>([]);
  const [open, setOpen] = useState(false);

  const tagSlugs = useMemo(() => initialTags.split(",").filter(Boolean), [initialTags]);

  useEffect(() => {
    const tagMap = new Map(availableTags.map((tag) => [tag.slug, tag]));
    const matchingTags = tagSlugs
      .map((slug) => tagMap.get(slug))
      .filter((tag): tag is Tag => !!tag);
    setSelectedTags(matchingTags);
    setAppliedTags(matchingTags);
  }, [availableTags, tagSlugs]);

  return (
    <TagsPopoverContent
      appliedTags={appliedTags}
      availableTags={availableTags}
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
