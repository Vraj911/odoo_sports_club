import { forwardRef, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

export interface IconButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  "aria-label": string;
  icon: ReactNode;
  variant?: "ghost" | "solid" | "volt";
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, variant = "ghost", size = "md", className, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-pill transition-colors",
        size === "sm" ? "size-8" : "size-10",
        variant === "ghost" && "text-chalk/80 hover:bg-chalk/10 hover:text-chalk",
        variant === "solid" && "border border-line bg-chalk/10 text-chalk hover:bg-chalk/15",
        variant === "volt" && "bg-volt-400 text-ink-900 hover:bg-volt-500",
        className,
      )}
      {...props}
    >
      {icon}
    </motion.button>
  );
});
