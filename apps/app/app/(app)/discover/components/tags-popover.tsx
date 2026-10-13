"use client";

import { useState } from "react";

import type { Tag } from "@/lib/content/types";

import { TagsPopoverContent } from "./tags-popover-content";

/** The tags named in a comma-separated slug list, in that order (unknown slugs skipped). */
const matchTags = (availableTags: Tag[], tagSlugs: string) => {
  const tagMap = new Map(availableTags.map((tag) => [tag.slug, tag]));
  return tagSlugs
    .split(",")
    .filter(Boolean)
    .map((slug) => tagMap.get(slug))
    .filter((tag): tag is Tag => !!tag);
};

export const TagsPopover = ({
  initialTags,
  onApplyTags,
  availableTags,
}: {
  initialTags: string;
  onApplyTags: (tagSlugs: string) => void;
  availableTags: Tag[];
}) => {
  const [selectedTags, setSelectedTags] = useState<Tag[]>(() =>
    matchTags(availableTags, initialTags)
  );
  const [appliedTags, setAppliedTags] = useState<Tag[]>(() =>
    matchTags(availableTags, initialTags)
  );
  const [open, setOpen] = useState(false);

  // Re-sync both selections when the props change (adjusting state while rendering
  // instead of in an effect).
  const [syncedWith, setSyncedWith] = useState({ availableTags, initialTags });
  if (syncedWith.availableTags !== availableTags || syncedWith.initialTags !== initialTags) {
    setSyncedWith({ availableTags, initialTags });
    const matchingTags = matchTags(availableTags, initialTags);
    setSelectedTags(matchingTags);
    setAppliedTags(matchingTags);
  }

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
};
