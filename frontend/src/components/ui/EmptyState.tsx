import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("flex flex-col items-center gap-3 text-center", className)} padding="lg">
      {icon && (
        <div className="flex size-14 items-center justify-center rounded-pill bg-volt-400 text-ink-900">{icon}</div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <div className="max-w-md text-sm text-chalk/70">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}
