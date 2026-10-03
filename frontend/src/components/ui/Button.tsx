import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-volt-400 text-ink-900 font-medium hover:bg-volt-500 active:bg-volt-600 shadow-volt border border-transparent",
  secondary:
    "bg-transparent border border-chalk text-chalk hover:bg-chalk/10 active:bg-chalk/20 font-medium",
  ghost:
    "bg-transparent border border-transparent text-chalk/80 hover:text-chalk hover:bg-chalk/10 font-medium",
  danger:
    "bg-[#F87171]/16 text-[#FCA5A5] border border-[#F87171]/40 hover:bg-[#F87171]/24 active:bg-[#F87171]/32 font-medium",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-[36px] px-4 text-xs gap-2",
  md: "h-[44px] px-6 text-sm gap-2",
  lg: "h-[52px] px-[28px] text-base gap-2.5",
};

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, leftIcon, rightIcon, className, children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.97 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-pill whitespace-nowrap transition-all duration-150 focus-visible:outline-2 focus-visible:outline-volt-400 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin shrink-0" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </motion.button>
  );
});
