import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

export interface StepItem {
  id: string;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  activeStep: number; // 0-indexed
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({ steps, activeStep, onStepClick, className }: StepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between relative">
        {/* Track Line Behind */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-white/10 z-0" />
        
        {steps.map((step, idx) => {
          const isCompleted = idx < activeStep;
          const isActive = idx === activeStep;
          const isClickable = onStepClick && idx <= activeStep;

          return (
            <div
              key={step.id}
              className="relative z-10 flex flex-col items-center group cursor-default"
              onClick={() => isClickable && onStepClick(idx)}
            >
              <div
                className={cn(
                  "size-9 rounded-pill flex items-center justify-center text-xs font-semibold transition-all duration-200",
                  isCompleted && "bg-volt-400 text-ink-900 shadow-glow-volt cursor-pointer",
                  isActive && "bg-volt-400 text-ink-900 ring-4 ring-volt-400/25 scale-105",
                  !isCompleted && !isActive && "bg-court-700 text-white/50 border border-white/20"
                )}
              >
                {isCompleted ? <Check className="size-4 stroke-[2.5]" /> : idx + 1}
              </div>

              <div className="absolute top-11 flex flex-col items-center text-center whitespace-nowrap">
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isActive ? "text-volt-400 font-semibold" : isCompleted ? "text-white" : "text-white/40"
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="hidden sm:inline text-[10px] text-white/40">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
