import { CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import type { BookingStatus } from "@/features/booking/types";
import { cn } from "@/lib/cn";

export interface TimelineEntry {
  status: BookingStatus;
  timestamp: number;
  note?: string | undefined;
}

export interface StatusTimelineProps {
  currentStatus: BookingStatus;
  timeline?: TimelineEntry[] | undefined;
  className?: string | undefined;
}

interface StepConfig {
  key: BookingStatus;
  label: string;
  description: string;
}

const HAPPY_STEPS: StepConfig[] = [
  { key: "PENDING", label: "Hold / Reserved", description: "Cart held or pending confirmation" },
  { key: "CONFIRMED", label: "Confirmed", description: "Payment cleared & court locked" },
  { key: "CHECKED_IN", label: "Checked In", description: "QR code verified at front desk" },
  { key: "COMPLETED", label: "Completed", description: "Match played & slot finished" },
];

export function StatusTimeline({ currentStatus, timeline = [], className }: StatusTimelineProps) {
  const isCancelled = currentStatus === "CANCELLED";
  const isNoShow = currentStatus === "NO_SHOW";
  const isWaitlisted = currentStatus === "WAITLISTED";

  const getStepIndex = (status: BookingStatus): number => {
    switch (status) {
      case "PENDING":
        return 0;
      case "CONFIRMED":
        return 1;
      case "CHECKED_IN":
        return 2;
      case "COMPLETED":
        return 3;
      default:
        return 1; // branching from confirmed
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  const formatTime = (ts?: number) => {
    if (!ts) return null;
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(ts));
  };

  return (
    <div className={cn("flex flex-col gap-4 rounded-[20px] border border-chalk/14 bg-court-500/80 p-6", className)}>
      <div className="flex items-center justify-between border-b border-chalk/10 pb-4">
        <div>
          <h3 className="text-sm font-semibold text-chalk tracking-wide uppercase">Booking Lifecycle</h3>
          <p className="text-xs text-chalk/60 mt-0.5">Live status progression & audit events</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
            currentStatus === "CONFIRMED" && "bg-volt-400/16 text-volt-400 border border-volt-400/32",
            currentStatus === "COMPLETED" && "bg-success/16 text-success border border-success/32",
            currentStatus === "CHECKED_IN" && "bg-info/16 text-info border border-info/32",
            currentStatus === "CANCELLED" && "bg-danger/16 text-danger border border-danger/32",
            currentStatus === "NO_SHOW" && "bg-warning/16 text-warning border border-warning/32",
            currentStatus === "WAITLISTED" && "bg-amber-400/16 text-amber-300 border border-amber-400/32",
            currentStatus === "PENDING" && "bg-chalk/16 text-chalk border border-chalk/32"
          )}
        >
          <span className="size-1.5 rounded-full bg-current animate-pulse" />
          {currentStatus.replace("_", " ")}
        </span>
      </div>

      {/* Main Happy Path Steps */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-chalk/14">
        {HAPPY_STEPS.map((step, idx) => {
          const isDone = !isCancelled && !isNoShow && !isWaitlisted && idx <= currentIndex;
          const isCurrent = !isCancelled && !isNoShow && !isWaitlisted && idx === currentIndex;
          const entry = timeline.find((t) => t.status === step.key);

          return (
            <div key={step.key} className="relative group">
              {/* Dot */}
              <div
                className={cn(
                  "absolute -left-6 top-0.5 flex size-5 items-center justify-center rounded-full border transition-all",
                  isDone
                    ? "bg-volt-400 border-volt-400 text-ink-900 shadow-volt"
                    : isCurrent
                    ? "bg-court-600 border-volt-400 text-volt-400 ring-4 ring-volt-400/20"
                    : "bg-court-700 border-chalk/20 text-chalk/40"
                )}
              >
                {isDone ? <CheckCircle2 className="size-3.5 stroke-[2.5]" /> : <Clock className="size-3" />}
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs font-semibold tracking-wide",
                      isDone || isCurrent ? "text-chalk" : "text-chalk/40"
                    )}
                  >
                    {step.label}
                  </span>
                  {entry?.timestamp && (
                    <span className="text-[10px] text-chalk/50 font-mono">
                      {formatTime(entry.timestamp)}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-chalk/60 mt-0.5">{step.description}</p>
                {entry?.note && (
                  <p className="mt-1 text-xs text-volt-400/90 bg-court-600/60 rounded-md px-2 py-1 border border-white/5 font-mono">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Branch: CANCELLED */}
        {isCancelled && (
          <div className="relative pt-2">
            <div className="flex items-center gap-2 text-danger text-xs font-semibold">
              <ArrowRight className="size-3.5 text-danger" />
              <span>Branch: Cancelled</span>
            </div>
            <div className="mt-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-chalk">
              <div className="flex items-center gap-2 text-danger font-medium">
                <XCircle className="size-4 shrink-0" />
                <span>Booking Cancelled & Slot Freed</span>
              </div>
              {timeline.find((t) => t.status === "CANCELLED")?.note && (
                <p className="mt-1 text-chalk/80 pl-6">
                  {timeline.find((t) => t.status === "CANCELLED")?.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Branch: NO SHOW */}
        {isNoShow && (
          <div className="relative pt-2">
            <div className="flex items-center gap-2 text-warning text-xs font-semibold">
              <ArrowRight className="size-3.5 text-warning" />
              <span>Branch: No Show</span>
            </div>
            <div className="mt-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-chalk">
              <div className="flex items-center gap-2 text-warning font-medium">
                <AlertTriangle className="size-4 shrink-0" />
                <span>Member Marked No-Show</span>
              </div>
              {timeline.find((t) => t.status === "NO_SHOW")?.note && (
                <p className="mt-1 text-chalk/80 pl-6">
                  {timeline.find((t) => t.status === "NO_SHOW")?.note}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Branch: WAITLISTED */}
        {isWaitlisted && (
          <div className="relative pt-2">
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-chalk">
              <div className="flex items-center gap-2 text-amber-300 font-medium">
                <Clock className="size-4 shrink-0" />
                <span>On Waiting List</span>
              </div>
              <p className="mt-1 text-chalk/80 pl-6">
                You will be auto-promoted and notified if a confirmed slot opens up.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
