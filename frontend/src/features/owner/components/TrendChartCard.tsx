import { useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatINR } from "../ownerStore";

export interface TrendChartCardProps {
  title: string;
  subtitle?: string;
  data: { name: string; amount: number; percentage?: number; color: string }[];
  onItemClick?: (item: { name: string; amount: number }) => void;
  className?: string;
  defaultChartType?: "bar" | "line" | "donut";
}

export function TrendChartCard({
  title,
  subtitle,
  data,
  onItemClick,
  className,
  defaultChartType = "donut",
}: TrendChartCardProps) {
  const [chartType, setChartType] = useState<"bar" | "line" | "donut">(defaultChartType);

  const totalAmount = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card className={cn("p-5 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-chalk">{title}</h3>
          {subtitle && <p className="text-xs text-chalk/60">{subtitle}</p>}
        </div>

        {/* Chart type toggle */}
        <div className="flex items-center bg-court-700/60 p-0.5 rounded-xl border border-chalk/10">
          <button
            type="button"
            onClick={() => setChartType("donut")}
            className={cn(
              "p-1.5 rounded-lg text-chalk transition-colors",
              chartType === "donut" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/60 hover:text-chalk"
            )}
            title="Donut Distribution"
          >
            <PieChartIcon className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType("bar")}
            className={cn(
              "p-1.5 rounded-lg text-chalk transition-colors",
              chartType === "bar" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/60 hover:text-chalk"
            )}
            title="Bar Chart"
          >
            <BarChart3 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setChartType("line")}
            className={cn(
              "p-1.5 rounded-lg text-chalk transition-colors",
              chartType === "line" ? "bg-volt-400 text-ink-900 font-bold" : "text-chalk/60 hover:text-chalk"
            )}
            title="Line Trend"
          >
            <LineChartIcon className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-48 w-full flex items-center justify-center">
        {chartType === "donut" ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={4}
                onClick={(entry) => onItemClick?.(entry)}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatINR(val), "Revenue"]}
                contentStyle={{
                  backgroundColor: "#0d1b2a",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : chartType === "bar" ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val: number) => [formatINR(val), "Revenue"]}
                contentStyle={{
                  backgroundColor: "#0d1b2a",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#fff",
                }}
              />
              <Bar
                dataKey="amount"
                radius={[6, 6, 0, 0]}
                onClick={(entry) => onItemClick?.(entry)}
                className="cursor-pointer"
              >
                {data.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
              <Tooltip
                formatter={(val: number) => [formatINR(val), "Revenue"]}
                contentStyle={{
                  backgroundColor: "#0d1b2a",
                  borderColor: "rgba(255,255,255,0.15)",
                  borderRadius: 12,
                  fontSize: 12,
                  color: "#fff",
                }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#d5f63a"
                strokeWidth={3}
                dot={{ fill: "#d5f63a", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend / Breakdown List with click-to-drilldown */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-chalk/10">
        {data.map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => onItemClick?.(item)}
            className="flex items-center justify-between p-2 rounded-xl bg-court-700/40 hover:bg-court-700 transition-colors text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-chalk/80 truncate group-hover:text-chalk">{item.name}</span>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono text-xs font-bold text-volt-400">{formatINR(item.amount)}</p>
              {item.percentage !== undefined && (
                <p className="text-[10px] text-chalk/50 font-mono">{item.percentage}%</p>
              )}
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
