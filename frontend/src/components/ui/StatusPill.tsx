import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral" | "volt";

const styles: Record<StatusVariant, { bg: string; border: string; text: string; dot: string }> = {
  success: {
    bg: "bg-success/16",
    border: "border-success/32",
    text: "text-success",
    dot: "bg-success",
  },
  warning: {
    bg: "bg-warning/16",
    border: "border-warning/32",
    text: "text-warning",
    dot: "bg-warning",
  },
  danger: {
    bg: "bg-danger/16",
    border: "border-danger/32",
    text: "text-danger",
    dot: "bg-danger",
  },
  info: {
    bg: "bg-info/16",
    border: "border-info/32",
    text: "text-info",
    dot: "bg-info",
  },
  neutral: {
    bg: "bg-chalk/16",
    border: "border-chalk/32",
    text: "text-chalk/90",
    dot: "bg-chalk/70",
  },
  volt: {
    bg: "bg-volt-400/16",
    border: "border-volt-400/32",
    text: "text-volt-400",
    dot: "bg-volt-400",
  },
};

export interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant | undefined;
  tone?: StatusVariant | undefined;
  showDot?: boolean | undefined;
}

export function StatusPill({ variant, tone = "neutral", showDot = true, className, children, ...props }: StatusPillProps) {
  const activeVariant = variant ?? tone ?? "neutral";
  const st = styles[activeVariant] ?? styles.neutral;
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-pill border px-2.5 text-xs font-medium leading-none whitespace-nowrap",
        st.bg,
        st.border,
        st.text,
        className
      )}
      {...props}
    >
      {showDot && <span className={cn("size-1.5 rounded-full shrink-0", st.dot)} aria-hidden />}
      {children}
    </span>
  );
}
