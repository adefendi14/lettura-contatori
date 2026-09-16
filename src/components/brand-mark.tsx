import { Droplet, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  const compact = size === "sm";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-xl bg-[#f4f1ea] ring-1 ring-black/8",
        compact ? "h-8 w-8" : "h-10 w-10",
        className
      )}
      aria-hidden
    >
      <Droplet
        className={cn(
          "text-[#3A6B8C]",
          compact ? "h-4 w-4" : "h-5 w-5"
        )}
        fill="currentColor"
        strokeWidth={1.5}
      />
      <Flame
        className={cn(
          "absolute text-[#AF3026]",
          compact ? "-bottom-0.5 -right-0.5 h-3 w-3" : "-bottom-0.5 -right-0.5 h-3.5 w-3.5"
        )}
        fill="currentColor"
        strokeWidth={1.5}
      />
    </span>
  );
}
