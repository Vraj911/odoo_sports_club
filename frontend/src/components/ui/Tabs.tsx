import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TabItem {
  value: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function Tabs({ items, value, onChange, className, ...rest }: TabsProps) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={cn("inline-flex rounded-pill border border-line bg-navy-900/50 p-1", className)}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative rounded-pill px-4 py-1.5 text-sm font-medium transition-colors",
              active ? "text-ink-900" : "text-chalk/70 hover:text-chalk",
            )}
          >
            {active && (
              <motion.span
                layoutId={`tab-indicator-${id}`}
                className="absolute inset-0 rounded-pill bg-volt-400"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
