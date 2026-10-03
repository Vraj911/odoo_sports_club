import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { cn } from "@/lib/cn";

export interface StatItem {
  value: string;
  numericValue: number;
  suffix?: string | undefined;
  prefix?: string | undefined;
  label: string;
}

const DEFAULT_STATS: StatItem[] = [
  { value: "2,400+", numericValue: 2400, suffix: "+", label: "Active Members" },
  { value: "32", numericValue: 32, suffix: "", label: "Championship Courts" },
  { value: "40+", numericValue: 40, suffix: "+", label: "Certified Staff" },
  { value: "98%", numericValue: 98, suffix: "%", label: "Member Satisfaction" },
];

export function StatsBand({ items = DEFAULT_STATS, className }: { items?: StatItem[] | undefined; className?: string | undefined }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <div
      ref={ref}
      className={cn(
        "w-full border-t border-chalk/14 bg-court-600 px-6 py-4 sm:py-0 sm:h-24 flex items-center justify-center shrink-0",
        className
      )}
    >
      <div className="grid w-full max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-8 text-center divide-y sm:divide-y-0 sm:divide-x divide-chalk/10">
        {items.map((stat, idx) => (
          <div key={idx} className={cn("flex flex-col items-center justify-center pt-2 sm:pt-0", idx > 0 && "sm:pl-4")}>
            <AnimatedCount
              value={stat.numericValue}
              prefix={stat.prefix}
              suffix={stat.suffix}
              fallback={stat.value}
              start={isInView}
            />
            <span className="text-xs sm:text-sm font-normal text-chalk/90">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimatedCount({
  value,
  prefix = "",
  suffix = "",
  fallback,
  start,
}: {
  value: number;
  prefix?: string | undefined;
  suffix?: string | undefined;
  fallback: string;
  start: boolean;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const duration = 1600;

    function animate(currentTime: number) {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easedProgress * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [start, value]);

  const displayString = start
    ? `${prefix}${count.toLocaleString("en-IN")}${suffix}`
    : fallback;

  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={start ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="text-2xl sm:text-3xl font-medium tracking-tight text-volt-400 font-mono tabular-nums"
    >
      {displayString}
    </motion.span>
  );
}
