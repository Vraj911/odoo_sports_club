import { cn } from "@/lib/cn";

export interface LeaveBalanceRingProps {
  label: string;
  total: number;
  used: number;
  color?: string;
  className?: string;
}

export function LeaveBalanceRing({
  label,
  total,
  used,
  color = "stroke-volt-400",
  className,
}: LeaveBalanceRingProps) {
  const remaining = Math.max(0, total - used);
  const percentage = total > 0 && total < 999 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  // SVG circle calculations
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={cn(
        "rounded-[20px] border border-chalk/14 bg-court-500 p-4 flex items-center justify-between gap-4 transition-all hover:border-chalk/28 hover:-translate-y-0.5",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-chalk/60">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-black font-mono text-chalk">
            {total >= 999 ? "Unlimited" : remaining}
          </span>
          {total < 999 && (
            <span className="text-xs text-chalk/50 font-mono">/ {total} days</span>
          )}
        </div>
        <p className="text-[11px] text-chalk/70">
          {total >= 999 ? `${used} days taken` : `${used} days used · ${remaining} left`}
        </p>
      </div>

      {total < 999 ? (
        <div className="relative size-16 shrink-0 flex items-center justify-center">
          <svg className="size-16 -rotate-90">
            <circle
              cx="32"
              cy="32"
              r={radius}
              className="stroke-chalk/10"
              strokeWidth="5"
              fill="transparent"
            />
            <circle
              cx="32"
              cy="32"
              r={radius}
              className={cn("transition-all duration-500", color)}
              strokeWidth="5"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-[11px] font-bold font-mono text-chalk">
            {100 - percentage}%
          </span>
        </div>
      ) : (
        <div className="size-12 rounded-full bg-volt-400/10 border border-volt-400/30 flex items-center justify-center text-volt-400 font-bold text-xs">
          ∞
        </div>
      )}
    </div>
  );
}
