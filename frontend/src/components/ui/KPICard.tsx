import { Card } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface KPICardProps {
  label: string;
  value: string | number;
  delta?: {
    value: string;
    isPositive: boolean;
  };
  sparklineData?: { v: number }[];
  className?: string;
}

export function KPICard({ label, value, delta, sparklineData, className }: KPICardProps) {
  return (
    <Card className={cn("flex flex-col justify-between gap-4 p-5", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-normal text-chalk/80">{label}</span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-pill px-2 py-0.5 text-xs font-medium leading-none",
              delta.isPositive ? "bg-success/16 text-success border border-success/30" : "bg-danger/16 text-danger border border-danger/30"
            )}
          >
            {delta.isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {delta.value}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="text-[32px] font-medium leading-none tracking-tight text-volt-400 font-mono tabular-nums">
          {value}
        </div>

        {sparklineData && sparklineData.length > 1 && (() => {
          const min = Math.min(...sparklineData.map((d) => d.v));
          const max = Math.max(...sparklineData.map((d) => d.v));
          const range = max - min || 1;
          const w = 90;
          const h = 32;
          const pts = sparklineData.map((d, i) => {
            const x = (i / (sparklineData.length - 1)) * (w - 8) + 4;
            const y = h - ((d.v - min) / range) * (h - 8) - 4;
            return `${x},${y}`;
          });
          const pathD = `M ${pts.join(" L ")}`;
          const areaD = `M ${pts[0]} L ${pts.join(" L ")} L ${pts[pts.length - 1]?.split(",")[0]},${h} L ${pts[0]?.split(",")[0]},${h} Z`;
          const gradId = `spark-${label.replace(/[^a-zA-Z0-9]/g, "")}`;

          return (
            <div className="h-8 w-24 shrink-0 overflow-hidden">
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d5f63a" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#d5f63a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path d={areaD} fill={`url(#${gradId})`} />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#d5f63a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          );
        })()}
      </div>
    </Card>
  );
}
