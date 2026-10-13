import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * A round profile photo, served through next/image at the size it's shown
 * (the originals are 800×800). Without a photo, the person's initial stands in.
 *
 * `size` is the largest rendered size in CSS pixels; set the box itself with
 * `className` (e.g. `size-16 sm:size-24`).
 */
export const ProfilePhoto = ({
  name,
  src,
  size,
  alt = "",
  preload = false,
  className,
  initialClassName,
}: {
  name: string;
  src: string | null | undefined;
  size: number;
  /** Empty when the name is already next to the photo */
  alt?: string;
  /** Preload above-the-fold photos (the largest one on the page) */
  preload?: boolean;
  className?: string;
  initialClassName?: string;
}) => (
  <span
    className={cn(
      "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E4DACC] text-[#4A433D] after:absolute after:inset-0 after:rounded-full after:border after:border-black/8",
      className
    )}
  >
    {src ? (
      <Image
        alt={alt}
        className="object-cover"
        fill
        preload={preload}
        sizes={`${size}px`}
        src={src}
      />
    ) : (
      <span aria-hidden="true" className={cn("font-serif leading-none", initialClassName)}>
        {name.trim().charAt(0).toUpperCase()}
      </span>
    )}
  </span>
);
