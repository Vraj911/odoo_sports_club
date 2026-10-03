import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-chalk/14 bg-court-500 p-6 text-chalk transition-all duration-200",
        interactive && "hover:-translate-y-[2px] hover:border-chalk/28 hover:shadow-card cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
