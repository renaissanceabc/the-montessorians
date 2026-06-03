"use client";

import { LinkIcon, NewspaperIcon, ShareIcon } from "lucide-react";
import Link from "next/link";
import {
  ImdbIcon,
  InstagramIcon,
  LinkedInIcon,
  TikTokIcon,
  WikipediaIcon,
  XIcon,
  YouTubeIcon,
} from "@/components/icons";
import { ShareDialogTrigger } from "@/components/share-dialog-trigger";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { prettyUrl } from "@/lib/utils";
import type { ProfilePage } from "@/lib/content/types";

export default function ProfileDetails({ profile }: { profile: ProfilePage["profile"] }) {
  if (!profile) {
    return <div>No profile found</div>;
  }

  const linkIcons = {
    wikipedia: <WikipediaIcon className="h-4 w-4" />,
    linkedin: <LinkedInIcon className="h-4 w-4" />,
    website: <LinkIcon className="h-4 w-4" />,
    x: <XIcon className="h-4 w-4" />,
    tiktok: <TikTokIcon className="h-4 w-4" />,
    instagram: <InstagramIcon className="h-4 w-4" />,
    article: <NewspaperIcon className="h-4 w-4" />,
    youtube: <YouTubeIcon className="h-4 w-4" />,
    imdb: <ImdbIcon className="h-4 w-4" />,
  };

  return (
    <div className="flex w-full flex-col items-center gap-10">
      <Avatar className="h-48 w-48 rounded-full border border-gray-200">
        <AvatarImage alt={profile.name} src={profile.imageUrl ?? ""} />
        <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="flex flex-col items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-center font-semibold font-serif text-4xl">{profile.name}</h1>

          {profile.tagline && (
            <p className="text-center text-muted-foreground text-xl italic">{profile.tagline}</p>
          )}
        </div>

        {profile.tags?.length && (
          <div className="flex flex-wrap gap-2">
            {profile.tags?.map((tag) => (
              <Badge className="bg-white/50" key={tag.slug} variant="outline">
                {tag.label}
              </Badge>
            ))}
          </div>
        )}

        <ShareDialogTrigger profile={profile}>
          {({ onClick }) => (
            <Button className="text-xs" onClick={onClick} size="sm" variant="ghost">
              <ShareIcon className="h-4 w-4" />
              <span>Share this profile</span>
            </Button>
          )}
        </ShareDialogTrigger>
      </div>

      <Separator className="w-full bg-black/10" />

      {profile.bio && <p className="text-base">{profile.bio}</p>}

      {profile.quotes && profile.quotes.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="font-semibold text-sm">
            A quote from {profile.name} about their education:
          </p>

          <div className="space-y-4">
            {profile.quotes?.map((quote) => (
              <blockquote
                className="border-l-4 border-l-primary/25 pl-5 text-lg text-primary italic sm:pl-10"
                key={quote}
              >
                <p>"{quote}"</p>
              </blockquote>
            ))}
          </div>
        </div>
      )}

      <Separator className="w-full bg-black/10" />

      <dl className="grid w-full grid-cols-3 gap-x-10 gap-y-4 text-sm">
        {/* {profile.education && profile.education.length > 0 && (
          <>
            <dt className="font-semibold">Education</dt>
            <dd className="col-span-2 flex flex-col gap-2">
              {profile.education?.map((education) => (
                <p key={education}>{toTitleCase(education)}</p>
              ))}
            </dd>
          </>
        )} */}
        {profile.educationNotes && (
          <>
            <dt className="font-semibold">Education Notes</dt>
            <dd className="col-span-2 flex flex-col gap-2">
              <p>{profile.educationNotes}</p>
            </dd>
          </>
        )}

        {profile.notableAchievements && profile.notableAchievements.length > 0 && (
          <>
            <dt className="font-semibold">Notable Achievements</dt>
            <dd className="col-span-2 flex flex-col gap-2">
              <ul className="list-disc space-y-1 pl-4">
                {profile.notableAchievements?.map((achievement) => (
                  <li className="pl-2" key={achievement}>
                    {achievement}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}

        {profile.links && profile.links.length > 0 && (
          <>
            <dt className="font-semibold">Links</dt>
            <dd className="col-span-2 flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                {profile.links.map((link) => (
                  <Link
                    className="wrap-anywhere flex flex-row gap-2 underline hover:text-primary"
                    href={link.url}
                    key={link.url}
                    target="_blank"
                  >
                    <span className="mt-1 size-4 shrink-0">{linkIcons[link.type]}</span>
                    {prettyUrl(link.url)}
                  </Link>
                ))}
              </div>
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
