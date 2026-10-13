import type { LucideIcon } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * An organization's logo in a square tile, or its type icon when the dataset
 * has no logo (images/organizations/<slug>.svg|png).
 *
 * `size` is the tile's largest rendered size in CSS pixels, so raster logos are
 * resized to fit. SVGs are served as they are.
 */
export const OrgLogo = ({
  logoUrl,
  icon: Icon,
  size,
  className,
  iconClassName,
}: {
  logoUrl?: string | null;
  icon: LucideIcon;
  size: number;
  className?: string;
  iconClassName?: string;
}) => (
  <span
    className={cn(
      "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
      logoUrl ? "border border-black/10 bg-white" : "bg-[#E4DACC]",
      className
    )}
  >
    {logoUrl ? (
      <span className="relative size-[76%]">
        <Image
          alt=""
          className="object-contain"
          fill
          sizes={`${Math.ceil(size * 0.76)}px`}
          src={logoUrl}
          unoptimized={logoUrl.endsWith(".svg")}
        />
      </span>
    ) : (
      <Icon aria-hidden="true" className={cn("size-1/2 text-[#4A433D]", iconClassName)} />
    )}
  </span>
);
