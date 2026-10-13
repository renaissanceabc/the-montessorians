import { CheckIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Tag } from "@/lib/content/types";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

/** Search, toggle chips, and apply/clear: shared by the popover and the drawer. */
const TagsPanel = ({
  filteredTags,
  tagSearch,
  setTagSearch,
  selectedTags,
  setSelectedTags,
  appliedTags,
  setAppliedTags,
  setTagsQueryParam,
  setOpen,
  showClose,
}: {
  filteredTags: Tag[];
  tagSearch: string;
  setTagSearch: (tagSearch: string) => void;
  selectedTags: Tag[];
  setSelectedTags: (selectedTags: Tag[]) => void;
  appliedTags: Tag[];
  setAppliedTags: (appliedTags: Tag[]) => void;
  setTagsQueryParam: (tagSlugs: string) => void;
  setOpen: (open: boolean) => void;
  showClose?: boolean;
}) => {
  const isSelected = (tag: Tag) => selectedTags.some((t) => t.slug === tag.slug);
  const toggle = (tag: Tag) =>
    setSelectedTags(
      isSelected(tag) ? selectedTags.filter((t) => t.slug !== tag.slug) : [...selectedTags, tag]
    );

  const apply = () => {
    const slugs = selectedTags.map((t) => t.slug).join(",");
    setTagsQueryParam(slugs);
    if (slugs !== appliedTags.map((t) => t.slug).join(",")) {
      setAppliedTags([...selectedTags]);
    }
    setOpen(false);
  };

  const clear = () => {
    setTagSearch("");
    setSelectedTags([]);
  };

  return (
    <div className="flex max-h-[min(80dvh,560px)] flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
        <p className="text-sm font-semibold">
          Filter by tags
          {selectedTags.length > 0 && (
            <span className="text-muted-foreground ml-1.5 font-normal">
              · {selectedTags.length} selected
            </span>
          )}
        </p>
        {showClose && (
          <Button
            aria-label="Close"
            onClick={() => setOpen(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon />
          </Button>
        )}
      </div>

      <div className="px-4 pb-3">
        <InputGroup className="h-10">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search tags"
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags…"
            value={tagSearch}
          />
        </InputGroup>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
        {filteredTags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {filteredTags.map((tag) => {
              const on = isSelected(tag);
              return (
                <button
                  aria-pressed={on}
                  className={cn(
                    "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] transition-colors",
                    on
                      ? "border-secondary bg-secondary text-secondary-foreground"
                      : "border-black/12 bg-white/60 hover:border-black/40"
                  )}
                  key={tag.slug}
                  onClick={() => toggle(tag)}
                  type="button"
                >
                  {on && <CheckIcon className="size-3.5" />}
                  {tag.label}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No tags match &quot;{tagSearch}&quot;
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-black/10 px-4 py-3">
        <Button
          disabled={selectedTags.length === 0 && !tagSearch}
          onClick={clear}
          type="button"
          variant="ghost"
        >
          Clear
        </Button>
        <Button className="flex-1 sm:flex-none" onClick={apply} type="button">
          Show results
        </Button>
      </div>
    </div>
  );
};

export const TagsPopoverContent = ({
  selectedTags,
  setSelectedTags,
  appliedTags,
  setAppliedTags,
  setTagsQueryParam,
  open,
  setOpen,
  availableTags,
}: {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  appliedTags: Tag[];
  setAppliedTags: (tags: Tag[]) => void;
  setTagsQueryParam: (tagSlugs: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  availableTags: Tag[];
}) => {
  const [tagSearch, setTagSearch] = useState("");
  const isDesktop = useMediaQuery("(min-width: 640px)");

  const filteredTags = useMemo(() => {
    const q = tagSearch.trim().toLowerCase();
    return availableTags.filter((tag) => tag.label.toLowerCase().includes(q));
  }, [availableTags, tagSearch]);

  if (isDesktop) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          render={
            <Button
              className={cn(
                "h-9 cursor-pointer border-transparent bg-transparent font-normal shadow-none hover:bg-black/5 data-popup-open:bg-black/5",
                appliedTags.length > 0 && "font-medium"
              )}
              variant="outline"
            />
          }
        >
          <SlidersHorizontalIcon className="size-4" />
          {appliedTags.length > 0 ? `Filter · ${appliedTags.length}` : "Filter"}
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[min(480px,calc(100vw-2rem))] gap-0 p-0">
          <TagsPanel
            appliedTags={appliedTags}
            filteredTags={filteredTags}
            selectedTags={selectedTags}
            setAppliedTags={setAppliedTags}
            setOpen={setOpen}
            setSelectedTags={setSelectedTags}
            setTagSearch={setTagSearch}
            setTagsQueryParam={setTagsQueryParam}
            tagSearch={tagSearch}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger
        render={
          <Button
            className={cn(
              "h-9 cursor-pointer border-transparent bg-transparent font-normal shadow-none hover:bg-black/5",
              appliedTags.length > 0 && "font-medium"
            )}
            variant="outline"
          />
        }
      >
        <SlidersHorizontalIcon className="size-4" />
        {appliedTags.length > 0 ? `Filter · ${appliedTags.length}` : "Filter"}
      </DrawerTrigger>
      <DrawerContent className="bg-background">
        <DrawerTitle className="sr-only">Filter by tags</DrawerTitle>
        <TagsPanel
          appliedTags={appliedTags}
          filteredTags={filteredTags}
          selectedTags={selectedTags}
          setAppliedTags={setAppliedTags}
          setOpen={setOpen}
          setSelectedTags={setSelectedTags}
          setTagSearch={setTagSearch}
          setTagsQueryParam={setTagsQueryParam}
          showClose
          tagSearch={tagSearch}
        />
      </DrawerContent>
    </Drawer>
  );
};
