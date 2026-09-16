import { withBase } from "@/lib/site";
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
    // eslint-disable-next-line @next/next/no-img-element -- logo raster identico al marchio fornito
    <img
      src={withBase("/logo.png")}
      alt=""
      width={compact ? 32 : 40}
      height={compact ? 32 : 40}
      className={cn(
        "shrink-0 rounded-[22%]",
        compact ? "h-8 w-8" : "h-10 w-10",
        className
      )}
    />
  );
}
