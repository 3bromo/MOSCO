"use client";

import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Marks a block for the GSAP scroll reveal in MotionProvider.
 * Renders with the `.reveal` base styles so there is no flash before GSAP runs,
 * and degrades to visible when JS is unavailable (`.no-js` rule in globals).
 */
export default function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
  ...rest
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
} & Record<string, unknown>) {
  return (
    <Tag className={cn("reveal", className)} data-reveal data-reveal-delay={delay} {...rest}>
      {children}
    </Tag>
  );
}
