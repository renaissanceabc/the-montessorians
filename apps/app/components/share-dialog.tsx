"use client";

import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { FacebookIcon, LinkedInIcon, ThreadsIcon, XIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { addUtmParamsToUrl, getShareUrl, type SHARE_CONFIG } from "@/lib/url";
import { siteUrl } from "@/lib/utils";
import type { ProfilePage } from "@/trpc/types";

export function ShareDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ProfilePage["profile"];
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent className="bg-white sm:max-w-[320px]">
          <DialogHeader>
            <DialogTitle>Share this profile</DialogTitle>
            <DialogDescription>Share this profile with your friends</DialogDescription>
          </DialogHeader>
          <ShareContent onOpenChange={onOpenChange} profile={profile} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={onOpenChange} open={open}>
      <DrawerContent className="bg-white">
        <DrawerHeader>
          <DrawerTitle>Share this profile</DrawerTitle>
          <DrawerDescription>Share this profile with your friends</DrawerDescription>
        </DrawerHeader>
        <ShareContent onOpenChange={onOpenChange} profile={profile} />
        <DrawerFooter>
          <DrawerClose asChild>
            <Button className="cursor-pointer bg-stone-200 hover:bg-stone-200/80" variant="outline">
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function ShareContent({
  profile,
  onOpenChange,
}: {
  profile: ProfilePage["profile"];
  onOpenChange: (open: boolean) => void;
}) {
  const url = `${siteUrl}/${profile?.slug}`;

  const decoratedUrl = addUtmParamsToUrl(url, {
    source: "other",
    medium: "social",
    campaign: "profile",
  });

  const copyLink = () => {
    navigator.clipboard.writeText(decoratedUrl);
    toast.success("Link copied to clipboard");
    onOpenChange(false);
  };

  const handleShareClick = (platform: keyof typeof SHARE_CONFIG) => {
    const width = 550;
    const height = 420;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const windowFeatures = `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`;

    const text = `Did you know ${profile?.name} was a Montessorian?`;

    window.open(
      getShareUrl(platform, url, text),
      `share-${platform.toLowerCase()}`,
      windowFeatures
    );

    onOpenChange(false);
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <Button className="w-full" onClick={() => handleShareClick("X")} variant="ghost">
        <XIcon />
        <span>X / Twitter</span>
      </Button>
      <Button className="w-full" onClick={() => handleShareClick("LinkedIn")} variant="ghost">
        <LinkedInIcon />
        <span>LinkedIn</span>
      </Button>
      <Button className="w-full" onClick={() => handleShareClick("Facebook")} variant="ghost">
        <FacebookIcon />
        <span>Facebook</span>
      </Button>
      <Button className="w-full" onClick={() => handleShareClick("Threads")} variant="ghost">
        <ThreadsIcon />
        <span>Threads</span>
      </Button>
      <Button className="w-full" onClick={copyLink} variant="ghost">
        <CopyIcon />
        <span>Copy link</span>
      </Button>
    </div>
  );
}
