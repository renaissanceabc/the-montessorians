import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * An organization's logo in a square tile, or its type icon when the dataset
 * has no logo (images/organizations/<slug>.svg|png).
 */
export function OrgLogo({
  logoUrl,
  icon: Icon,
  className,
  iconClassName,
}: {
  logoUrl?: string | null;
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md",
        logoUrl ? "border border-black/10 bg-white" : "bg-[#E4DACC]",
        className
      )}
    >
      {logoUrl ? (
        // biome-ignore lint/performance/noImgElement: small static logos (often SVG); no optimization needed
        <img alt="" className="size-[76%] object-contain" loading="lazy" src={logoUrl} />
      ) : (
        <Icon className={cn("size-1/2 text-[#4A433D]", iconClassName)} />
      )}
    </span>
  );
}
