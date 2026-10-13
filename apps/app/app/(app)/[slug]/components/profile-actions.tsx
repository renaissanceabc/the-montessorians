import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { ProfilePhoto } from "@/components/profile-photo";
import type { AdjacentRef, ProfilePage } from "@/lib/content/types";
import { cn } from "@/lib/utils";

const AdjacentLink = ({
  profile,
  direction,
}: {
  profile: Extract<AdjacentRef, { slug: string }>;
  direction: "previous" | "next";
}) => {
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRightIcon : ArrowLeftIcon;
  return (
    <Link
      className={cn(
        "group flex min-w-0 items-center gap-2.5 rounded-full py-1 transition-colors",
        isNext ? "ml-auto flex-row-reverse pl-3 text-right" : "pr-3"
      )}
      href={`/${profile.slug}`}
      rel={direction === "previous" ? "prev" : "next"}
    >
      <Arrow
        className={cn(
          "text-muted-foreground group-hover:text-foreground size-4 shrink-0 transition-[color,translate] motion-reduce:transition-colors",
          isNext
            ? "group-hover:translate-x-0.5 motion-reduce:group-hover:translate-x-0"
            : "group-hover:-translate-x-0.5 motion-reduce:group-hover:translate-x-0"
        )}
      />
      <span className="flex min-w-0 items-center gap-2.5">
        <ProfilePhoto
          className="size-8"
          initialClassName="text-sm"
          name={profile.name}
          size={32}
          src={profile.imageUrl}
        />
        <span className="flex min-w-0 flex-col">
          <span className="text-muted-foreground text-xs">{isNext ? "Next" : "Previous"}</span>
          <span className="truncate font-semibold group-hover:underline">{profile.name}</span>
        </span>
      </span>
    </Link>
  );
};

const ProfileActions = ({
  previous,
  next,
}: {
  previous: ProfilePage["previous"];
  next: ProfilePage["next"];
}) => (
  <nav
    aria-label="More profiles"
    className="flex w-full items-center justify-between gap-4"
    data-print-hidden
  >
    {previous.slug && <AdjacentLink direction="previous" profile={previous} />}
    {next.slug && <AdjacentLink direction="next" profile={next} />}
  </nav>
);
export default ProfileActions;
