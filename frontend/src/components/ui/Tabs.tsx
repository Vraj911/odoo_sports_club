import { useId, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeId, onChange, className }: TabsProps) {
  const layoutGroupId = useId();

  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-chalk/8 p-1.5 backdrop-blur-sm border border-chalk/10 overflow-x-auto max-w-full",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 rounded-pill px-4 py-2 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap z-10 select-none",
              isActive ? "text-ink-900" : "text-chalk/70 hover:text-chalk",
              tab.disabled && "opacity-40 cursor-not-allowed"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={`active-tab-${layoutGroupId}`}
                className="absolute inset-0 rounded-pill bg-volt-400 shadow-volt z-[-1]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge && <span className="ml-1 shrink-0">{tab.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}
