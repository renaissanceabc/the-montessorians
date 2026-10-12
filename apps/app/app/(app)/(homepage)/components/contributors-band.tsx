import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/content/types";

/** A small, secondary nod to the people who built the field. Alumni stay the headline. */
export default function ContributorsBand({ contributors }: { contributors: Profile[] }) {
  if (contributors.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto max-w-screen-md px-4 pb-4 sm:px-8">
      <div className="flex flex-col gap-4 rounded-lg border border-black/10 bg-white/45 p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
          <div className="flex flex-col gap-0.5">
            <h2 className="font-bold text-lg">The people who built the field</h2>
            <p className="text-muted-foreground text-sm">
              Trainers, researchers, and authors with documented contributions to Montessori.
            </p>
          </div>
          <Link
            className="flex shrink-0 flex-row items-center gap-1 font-semibold text-sm hover:underline"
            href="/contributors"
          >
            Contributors <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {contributors.map((profile) => (
            <Link
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white py-1 pr-3 pl-1 text-sm transition-colors hover:border-black/30"
              href={`/${profile.slug}`}
              key={profile.slug}
            >
              <Avatar className="size-7">
                <AvatarImage alt="" src={profile.imageUrl ?? ""} />
                <AvatarFallback className="font-serif text-sm">
                  {profile.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {profile.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
