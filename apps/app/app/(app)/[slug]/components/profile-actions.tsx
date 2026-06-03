import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import type { ProfilePage } from "@/trpc/types";

export default function ProfileActions({
  previous,
  next,
}: {
  previous: ProfilePage["previous"];
  next: ProfilePage["next"];
}) {
  return (
    <div className="flex w-full items-center justify-between gap-10">
      {previous?.slug && (
        <Link
          className="flex items-center gap-2 font-semibold hover:underline"
          href={`/${previous.slug}`}
        >
          <ArrowLeftIcon className="h-4 w-4" /> {previous.name}
        </Link>
      )}
      {next?.slug && (
        <Link
          className="flex items-center gap-2 font-semibold hover:underline"
          href={`/${next.slug}`}
        >
          {next.name} <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
