import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface HeroFrameProps {
  children: ReactNode;
  className?: string;
}

/**
 * The floating rounded frame: the hero content sits inside a 28px-radius court-500 frame
 * floating over the dark navy backdrop with 12px inset from the viewport on desktop.
 */
export function HeroFrame({ children, className }: HeroFrameProps) {
  return (
    <div className="w-full bg-backdrop py-3 px-3 sm:py-4 sm:px-4">
      <div
        className={cn(
          "relative mx-auto flex min-h-[680px] h-[86vh] max-w-[1440px] flex-col overflow-hidden rounded-[24px] sm:rounded-[28px] border border-chalk/14 bg-court-500 shadow-card",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
