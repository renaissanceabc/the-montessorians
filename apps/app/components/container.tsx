import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

type ContainerElement = "div" | "section" | "header" | "footer" | "nav" | "article";

/**
 * The site shell. Every page, the header, and the footer sit in one, so their
 * content edges line up at every width.
 *
 * - `wide`: the full shell (72rem including a 20/32/56px gutter).
 * - `reading`: a 45rem (720px) column centered in the shell, for prose and forms.
 */
export const Container = ({
  as: Element = "div",
  size = "wide",
  className,
  ...props
}: ComponentProps<"div"> & {
  as?: ContainerElement;
  size?: "wide" | "reading";
}) => (
  <Element
    className={cn(size === "reading" ? "shell-reading" : "shell", className)}
    data-container={size}
    {...props}
  />
);
