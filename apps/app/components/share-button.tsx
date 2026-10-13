"use client";

import { ShareIcon } from "lucide-react";
import { useState } from "react";

import { ShareDialog } from "@/components/share-dialog";
import type { ShareTarget } from "@/components/share-dialog";

/**
 * Share a profile or organization: floats at the bottom of the screen on
 * phones (like the directory's filter bar), and sits inline on larger screens.
 */
export const ShareButton = ({ target }: { target: ShareTarget }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="max-sm:fixed max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:left-1/2 max-sm:z-40 max-sm:-translate-x-1/2 max-sm:rounded-full max-sm:bg-white/95 max-sm:p-1 max-sm:shadow-[0_8px_30px_rgba(0,0,0,0.12)] max-sm:ring-1 max-sm:ring-black/10"
        data-print-hidden
      >
        <button
          className="inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium transition-[background-color,scale] duration-150 ease-out hover:bg-black/6 active:scale-[0.97] motion-reduce:active:scale-100 sm:h-8 sm:border sm:border-black/10 sm:bg-white/60 sm:px-3"
          onClick={() => setOpen(true)}
          type="button"
        >
          <ShareIcon aria-hidden="true" className="size-4" />
          Share
        </button>
      </div>
      <ShareDialog onOpenChange={setOpen} open={open} target={target} />
    </>
  );
};
