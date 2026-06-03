"use client";

import { type ReactNode, useState } from "react";
import type { ProfilePage } from "@/trpc/types";
import { ShareDialog } from "./share-dialog";

export function ShareDialogTrigger({
  children,
  profile,
}: {
  children: (props: { onClick: () => void }) => ReactNode;
  profile: ProfilePage["profile"];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {children({ onClick: () => setOpen(true) })}
      <ShareDialog onOpenChange={setOpen} open={open} profile={profile} />
    </>
  );
}
