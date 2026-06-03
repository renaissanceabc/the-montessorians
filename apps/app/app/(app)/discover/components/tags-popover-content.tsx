import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import type { Tag } from "@/trpc/types";

export function TagsPopoverContent({
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
}) {
  const [tagSearch, setTagSearch] = useState("");
  const [_drawerOpen, _setDrawerOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filteredTags = useMemo(() => {
    return availableTags.filter(
      (tag) =>
        !selectedTags.some((t) => t.slug === tag.slug) &&
        tag.label.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [availableTags, selectedTags, tagSearch]);

  if (isDesktop) {
    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            className={cn(
              "cursor-pointer border-black/10 bg-white font-normal shadow-none hover:border-black/50 active:bg-white",
              appliedTags.length > 0 &&
                "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground focus:bg-secondary/80 focus:text-secondary-foreground active:bg-secondary/80 active:text-secondary-foreground"
            )}
            variant="outline"
          >
            <SlidersHorizontalIcon className="size-4" />
            {appliedTags.length > 0 ? `Filters applied (${appliedTags.length})` : "Filter"}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="max-w-full p-0 sm:w-[480px]">
          <TagsDrawerContent
            filteredTags={filteredTags}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            setTagSearch={setTagSearch}
            tagSearch={tagSearch}
          />

          <div className="flex flex-row items-center justify-between gap-2 border-black/10 border-t p-4">
            <TagsDrawerFooter
              appliedTags={appliedTags}
              selectedTags={selectedTags}
              setAppliedTags={setAppliedTags}
              setOpen={setOpen}
              setSelectedTags={setSelectedTags}
              setTagSearch={setTagSearch}
              setTagsQueryParam={setTagsQueryParam}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Drawer onOpenChange={setOpen} open={open}>
      <DrawerTrigger asChild>
        <Button
          className={cn(
            "cursor-pointer border-black/10 bg-white font-normal shadow-none hover:bg-white/50",
            appliedTags.length > 0 &&
              "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:text-secondary-foreground focus:bg-secondary/80 focus:text-secondary-foreground active:bg-secondary/80 active:text-secondary-foreground"
          )}
          variant="outline"
        >
          <SlidersHorizontalIcon className="size-4" />
          {appliedTags.length > 0 ? `Filters applied (${appliedTags.length})` : "Filter"}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-white">
        <DrawerHeader className="text-left">
          <DrawerTitle>Filter by tags</DrawerTitle>
          <DrawerDescription>
            Select tags below to filter the directory of Montessorians. When you&apos;re content
            with your selection, click <strong>Show Results</strong>.
          </DrawerDescription>
        </DrawerHeader>

        <TagsDrawerContent
          filteredTags={filteredTags}
          selectedTags={selectedTags}
          setSelectedTags={setSelectedTags}
          setTagSearch={setTagSearch}
          tagSearch={tagSearch}
        />

        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button className="cursor-pointer bg-stone-200 hover:bg-stone-200/80" variant="outline">
              Cancel
            </Button>
          </DrawerClose>

          <div className="grid grid-cols-2 gap-2">
            <TagsDrawerFooter
              appliedTags={appliedTags}
              selectedTags={selectedTags}
              setAppliedTags={setAppliedTags}
              setOpen={setOpen}
              setSelectedTags={setSelectedTags}
              setTagSearch={setTagSearch}
              setTagsQueryParam={setTagsQueryParam}
            />
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function TagsDrawerContent({
  filteredTags,
  setTagSearch,
  tagSearch,
  selectedTags,
  setSelectedTags,
}: {
  filteredTags: Tag[];
  setTagSearch: (tagSearch: string) => void;
  tagSearch: string;
  selectedTags: Tag[];
  setSelectedTags: (selectedTags: Tag[]) => void;
}) {
  return (
    <div className="flex flex-col gap-2 p-4">
      <Input
        className="w-full rounded-full border border-black/10 bg-white text-sm shadow-none"
        id="filters"
        onChange={(e) => setTagSearch(e.target.value)}
        placeholder="Search for a tag"
        value={tagSearch}
      />

      <div className="relative flex max-h-[200px] flex-col gap-2 overflow-y-auto rounded-sm border border-black/10 bg-stone-50">
        <div className="z-10 flex flex-wrap gap-1 p-2">
          {filteredTags.length > 0 ? (
            filteredTags.map((tag) => (
              <Button
                className="h-auto cursor-pointer border-1 border-black/10 bg-white px-3 py-1 text-xs shadow-none hover:border-black/50 hover:bg-white/50"
                key={tag.slug}
                onClick={() => setSelectedTags([...selectedTags, tag])}
                variant="outline"
              >
                {tag.label}
              </Button>
            ))
          ) : (
            <p className="px-2 text-muted-foreground text-xs">No tags found</p>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              className="h-auto border-1 border-black/10 px-3 py-1 text-xs shadow-none"
              key={tag.slug}
              variant="secondary"
            >
              {tag.label}
              <button
                className="cursor-pointer"
                onClick={() => setSelectedTags(selectedTags.filter((t) => t.slug !== tag.slug))}
                type="button"
              >
                <XIcon className="ml-1 h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function TagsDrawerFooter({
  setTagSearch,
  setTagsQueryParam,
  setSelectedTags,
  setAppliedTags,
  setOpen,
  selectedTags,
  appliedTags,
}: {
  setTagSearch: (tagSearch: string) => void;
  setTagsQueryParam: (tagSlugs: string) => void;
  setSelectedTags: (selectedTags: Tag[]) => void;
  setAppliedTags: (appliedTags: Tag[]) => void;
  setOpen: (open: boolean) => void;
  selectedTags: Tag[];
  appliedTags: Tag[];
}) {
  return (
    <>
      <Button
        className="cursor-pointer border-black/10 bg-transparent shadow-none"
        onClick={() => {
          setTagSearch("");
          setTagsQueryParam("");
          setSelectedTags([]);
          setAppliedTags([]);
          setOpen(false);
        }}
        variant="outline"
      >
        Clear
      </Button>
      <Button
        className="cursor-pointer shadow-none"
        onClick={() => {
          const slugs = selectedTags.map((t) => t.slug).join(",");
          setTagsQueryParam(slugs);

          if (slugs !== appliedTags.map((t) => t.slug).join(",")) {
            setAppliedTags([...selectedTags]);
          }
          setOpen(false);
        }}
      >
        Show results
      </Button>
    </>
  );
}
