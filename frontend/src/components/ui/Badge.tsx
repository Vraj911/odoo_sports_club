import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  live?: boolean;
}

export function Badge({ icon, live, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill bg-chalk px-3 h-7 text-xs font-medium text-ink-900 shadow-sm leading-none whitespace-nowrap",
        className,
      )}
      {...props}
    >
      {live ? (
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-green opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-brand-green" />
        </span>
      ) : (
        icon
      )}
      {children}
    </span>
  );
}
