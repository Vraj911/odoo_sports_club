import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/cn";
import { Money } from "@/components/shared/Money";
import type { Lead, LeadStage, FollowUpTask } from "../types";
import { LeadCard } from "./LeadCard";
import { isLeadOverdue } from "../crmStore";

interface LeadKanbanColumnProps {
  stage: LeadStage;
  label: string;
  leads: Lead[];
  tasks: FollowUpTask[];
}

export function LeadKanbanColumn({ stage, label, leads, tasks }: LeadKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  // Calculate pipeline total for this column
  const totalValue = leads.reduce((sum, l) => sum + l.estimatedValue, 0);

  // Pin overdue cards to the top
  const { overdueLeads, regularLeads } = leads.reduce(
    (acc, lead) => {
      if (isLeadOverdue(lead, tasks)) {
        acc.overdueLeads.push(lead);
      } else {
        acc.regularLeads.push(lead);
      }
      return acc;
    },
    { overdueLeads: [] as Lead[], regularLeads: [] as Lead[] }
  );

  // Header style & stage colors
  const getStageHeaderStyles = () => {
    switch (stage) {
      case "NEW":
        return {
          pill: "bg-sky-500/20 text-sky-300 border-sky-500/40",
          dot: "bg-sky-400",
        };
      case "CONTACTED":
        return {
          pill: "bg-amber-500/20 text-amber-300 border-amber-500/40",
          dot: "bg-amber-400",
        };
      case "QUOTE_SENT":
        return {
          pill: "bg-purple-500/20 text-purple-300 border-purple-500/40",
          dot: "bg-purple-400",
        };
      case "TRIAL_BOOKED":
        return {
          pill: "bg-volt-400/20 text-volt-300 border-volt-400/40",
          dot: "bg-volt-400",
        };
      case "WON":
        return {
          pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
          dot: "bg-emerald-400",
        };
      case "LOST":
        return {
          pill: "bg-rose-500/20 text-rose-300 border-rose-500/40",
          dot: "bg-rose-400",
        };
    }
  };

  const styles = getStageHeaderStyles();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-2xl border transition-all duration-200 min-w-[280px] max-w-[320px] flex-1 bg-court-700/60 p-3",
        isOver
          ? "border-volt-400/80 bg-court-600/70 shadow-[0_0_20px_rgba(213,246,58,0.2)]"
          : "border-white/10"
      )}
    >
      {/* Column Header */}
      <div className="pb-3 border-b border-white/10 mb-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                styles.pill
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
              {label}
            </span>
            <span className="text-xs font-medium text-white/50 bg-white/6 px-2 py-0.5 rounded-full">
              {leads.length}
            </span>
          </div>

          <div className="text-xs font-semibold text-volt-400">
            <Money amount={totalValue} />
          </div>
        </div>

        {overdueLeads.length > 0 && stage !== "WON" && stage !== "LOST" && (
          <div className="text-[11px] text-red-400 font-medium flex items-center gap-1 mt-1">
            <span>⏰ {overdueLeads.length} follow-up{overdueLeads.length > 1 ? "s" : ""} overdue</span>
          </div>
        )}
      </div>

      {/* Cards Scrollable Area */}
      <div className="flex-1 space-y-3 min-h-[300px] overflow-y-auto pr-1">
        {/* Overdue pinned on top */}
        {overdueLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} tasks={tasks} />
        ))}

        {/* Regular leads */}
        {regularLeads.map((lead) => (
          <LeadCard key={lead.id} lead={lead} tasks={tasks} />
        ))}

        {leads.length === 0 && (
          <div className="h-36 flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl text-white/40 text-xs">
            <span>No leads in {label.toLowerCase()}</span>
            {isOver && <span className="text-volt-400 mt-1 font-medium">Drop here</span>}
          </div>
        )}
      </div>
    </div>
  );
}
