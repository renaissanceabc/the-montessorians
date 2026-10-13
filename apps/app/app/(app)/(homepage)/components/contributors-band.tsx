import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/container";
import { ProfilePhoto } from "@/components/profile-photo";
import type { Profile } from "@/lib/content/types";

/** A small, secondary nod to the people who built the field. Alumni stay the headline. */
const ContributorsBand = ({ contributors }: { contributors: Profile[] }) => {
  if (contributors.length === 0) {
    return null;
  }

  return (
    <Container as="section" className="pb-4">
      <div className="flex flex-col gap-4 rounded-xl border border-black/10 bg-white/45 p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-baseline">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg font-bold">The people who built the field</h2>
            <p className="text-muted-foreground text-sm">
              Trainers, researchers, and authors with documented contributions to Montessori.
            </p>
          </div>
          <Link
            className="flex shrink-0 flex-row items-center gap-1 text-sm font-semibold hover:underline"
            href="/contributors"
          >
            Contributors <ArrowRightIcon aria-hidden="true" className="size-4" />
          </Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {contributors.map((profile) => (
            <li className="min-w-0" key={profile.slug}>
              <Link
                className="flex max-w-full items-center gap-2 rounded-full border border-black/10 bg-white py-1 pr-3 pl-1 text-sm transition-[color,background-color,border-color,scale] duration-150 ease-out hover:border-black/30 active:scale-[0.97] motion-reduce:active:scale-100"
                href={`/${profile.slug}`}
              >
                <ProfilePhoto
                  className="size-7"
                  initialClassName="text-sm"
                  name={profile.name}
                  size={28}
                  src={profile.imageUrl}
                />
                <span className="truncate">{profile.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
};
export default ContributorsBand;
