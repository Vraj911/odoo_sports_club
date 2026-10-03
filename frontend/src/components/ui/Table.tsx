import { useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key?: string;
  id?: string;
  header: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  cell?: (item: T, index: number) => ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyAction?: ReactNode;
  allowDensityToggle?: boolean;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = "No records found",
  emptySubtitle = "There are no data items to display at this time.",
  emptyAction,
  allowDensityToggle = true,
  className,
}: TableProps<T>) {
  const [compact, setCompact] = useState(false);
  const rowHeightClass = compact ? "h-[44px] py-2" : "h-[56px] py-3.5";

  return (
    <div className={cn("flex flex-col gap-2 w-full", className)}>
      {allowDensityToggle && (
        <div className="flex items-center justify-end px-1">
          <button
            onClick={() => setCompact((c) => !c)}
            className="flex items-center gap-1.5 text-xs text-chalk/60 hover:text-chalk transition-colors"
            title="Toggle Row Density"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Density: {compact ? "Compact (44px)" : "Comfortable (56px)"}</span>
          </button>
        </div>
      )}

      <div className="w-full overflow-hidden rounded-2xl border border-chalk/14 bg-court-500 shadow-card">
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 z-10 bg-court-700 text-chalk/80">
              <tr>
                {columns.map((col, cIdx) => (
                  <th
                    key={col.key || col.id || String(cIdx)}
                    className={cn(
                      "px-4 py-3.5 text-[12px] font-medium uppercase tracking-[0.04em] whitespace-nowrap border-b border-chalk/14",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {loading ? (
                Array.from({ length: 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className={cn("bg-court-500", rowHeightClass)}>
                    {columns.map((col, cIdx) => (
                      <td key={col.key || col.id || String(cIdx)} className="px-4">
                        <Skeleton className="h-4 w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center">
                    <EmptyState
                      title={emptyTitle}
                      subtitle={emptySubtitle}
                      action={emptyAction}
                    />
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr
                    key={keyExtractor(item, idx)}
                    className={cn(
                      "transition-colors hover:bg-chalk/6",
                      idx % 2 === 1 ? "bg-court-600/40" : "bg-court-500"
                    )}
                  >
                    {columns.map((col, cIdx) => {
                      const colKey = col.key || col.id || String(cIdx);
                      const renderFn = col.render || col.cell;
                      return (
                        <td
                          key={colKey}
                          className={cn(
                            "px-4 text-chalk transition-all",
                            rowHeightClass,
                            col.align === "center" && "text-center",
                            col.align === "right" && "text-right",
                            col.className
                          )}
                        >
                          {renderFn
                            ? renderFn(item, idx)
                            : String((item as Record<string, unknown>)[colKey] ?? "")}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
