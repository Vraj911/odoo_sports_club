import type { ReactNode } from "react";
import { CourtLines } from "@/components/brand/CourtLines";
import { cn } from "@/lib/cn";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-[20px] border border-chalk/14 bg-court-500 p-6 sm:p-8 shadow-card mb-6", className)}>
      <CourtLines variant="lines-faint" className="absolute inset-0 size-full" />
      <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-chalk">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-chalk/70 max-w-xl">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-3 mt-4 sm:mt-0">{actions}</div>}
      </div>
    </div>
  );
}
