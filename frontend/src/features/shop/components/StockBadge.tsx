import { cn } from "@/lib/cn";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export function StockBadge({ stock, className }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
          "bg-danger/15 text-danger border border-danger/30",
          className
        )}
      >
        <XCircle className="size-3" />
        Out of Stock
      </span>
    );
  }

  if (stock <= 3) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
          "bg-warning/15 text-warning border border-warning/30",
          className
        )}
      >
        <AlertTriangle className="size-3" />
        Only {stock} left
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold",
        "bg-success/15 text-success border border-success/30",
        className
      )}
    >
      <CheckCircle2 className="size-3" />
      In Stock
    </span>
  );
}
