import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "volt";

const tones: Record<StatusTone, { wrap: string; dot: string }> = {
  success: { wrap: "bg-success/15 text-success", dot: "bg-success" },
  warning: { wrap: "bg-warning/15 text-warning", dot: "bg-warning" },
  danger: { wrap: "bg-danger/15 text-danger", dot: "bg-danger" },
  info: { wrap: "bg-info/15 text-info", dot: "bg-info" },
  neutral: { wrap: "bg-chalk/10 text-chalk/80", dot: "bg-chalk/60" },
  volt: { wrap: "bg-volt-400/15 text-volt-400", dot: "bg-volt-400" },
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: StatusTone;
}

export function StatusPill({ tone = "neutral", className, children, ...props }: StatusPillProps) {
  const t = tones[tone];
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium", t.wrap, className)}
      {...props}
    >
      <span className={cn("size-1.5 rounded-pill", t.dot)} aria-hidden />
      {children}
    </span>
  );
}
