import { Card } from "@/components/ui/Card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ResponsiveContainer, LineChart, Line } from "recharts";
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

        {sparklineData && sparklineData.length > 0 && (
          <div className="h-10 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke="#d5f63a"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}
