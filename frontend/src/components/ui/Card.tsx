import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
}

const pad = { none: "", sm: "p-4", md: "p-6", lg: "p-8" };

export function Card({ padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-card border border-line bg-court-500 text-chalk shadow-card", pad[padding], className)}
      {...props}
    />
  );
}
