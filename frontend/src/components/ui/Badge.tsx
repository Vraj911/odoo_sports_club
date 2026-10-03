import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-chalk px-2.5 py-0.5 text-xs font-medium text-ink-900",
        className,
      )}
      {...props}
    />
  );
}
