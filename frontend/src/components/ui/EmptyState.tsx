import type { ReactNode } from "react";
import { CourtLines } from "@/components/brand/CourtLines";
import { cn } from "@/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode | undefined;
  title: string;
  description?: ReactNode | undefined;
  subtitle?: ReactNode | undefined;
  action?: ReactNode | undefined;
  className?: string | undefined;
}

export function EmptyState({ icon, title, description, subtitle, action, className }: EmptyStateProps) {
  const bodyText = description ?? subtitle;
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] border border-chalk/14 bg-court-500/80 p-8 flex flex-col items-center justify-center gap-3 text-center", className)}>
      <CourtLines variant="lines-faint" className="absolute inset-0 size-full" />
      <div className="relative z-10 flex flex-col items-center gap-3">
        {icon && (
          <div className="flex size-14 items-center justify-center rounded-pill bg-volt-400 text-ink-900 shadow-volt">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-chalk">{title}</h3>
        {bodyText && <div className="max-w-md text-sm text-chalk/70">{bodyText}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}
