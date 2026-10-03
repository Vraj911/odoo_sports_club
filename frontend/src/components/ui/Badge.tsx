import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeVariant = "default" | "volt" | "success" | "warning" | "danger" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-chalk text-ink-900",
  volt: "bg-volt-400/15 text-volt-400 border border-volt-400/30",
  success: "bg-success/15 text-success border border-success/30",
  warning: "bg-warning/15 text-warning border border-warning/30",
  danger: "bg-danger/15 text-danger border border-danger/30",
  info: "bg-info/15 text-info border border-info/30",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
  live?: boolean;
  variant?: BadgeVariant | undefined;
}

export function Badge({ icon, live, variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-3 h-7 text-xs font-medium shadow-sm leading-none whitespace-nowrap",
        VARIANT_CLASSES[variant],
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
