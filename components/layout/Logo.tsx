import { cn } from "@/lib/utils";

/**
 * Wordmark. Drawn as text (not an image) so it stays crisp at every size,
 * is selectable/indexable, and inherits colour over the 3D hero.
 */
export default function Logo({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-[15px] tracking-[0.34em]",
    md: "text-[19px] tracking-[0.36em]",
    lg: "text-[26px] tracking-[0.38em]",
  };
  return (
    <span
      className={cn(
        "font-display font-semibold uppercase leading-none select-none",
        sizes[size],
        className,
      )}
      style={{ fontFamily: "var(--font-display)" }}
    >
      Moscow
    </span>
  );
}
