import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { useGo } from "@/app/router/links";
import { useCan } from "@/lib/permissions";
import {
  Globe,
  Sparkles,
  Footprints,
  Phone,
  Users,
  Clock,
  AlertTriangle,
  Lock,
  Building,
  GripVertical,
} from "lucide-react";
import { Money } from "@/components/shared/Money";
import { cn } from "@/lib/cn";
import type { Lead, FollowUpTask } from "../types";
import { isLeadOverdue } from "../crmStore";

interface LeadCardProps {
  lead: Lead;
  tasks: FollowUpTask[];
  isOverlay?: boolean;
}

export function LeadCard({ lead, tasks, isOverlay = false }: LeadCardProps) {
  const go = useGo();
  const can = useCan();
  const canManage = can("crm.leads.manage");

  const overdue = isLeadOverdue(lead, tasks);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    disabled: !canManage,
    data: { lead },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 99,
      }
    : undefined;

  // Source icon mapping
  const renderSourceIcon = () => {
    switch (lead.source) {
      case "WEBSITE":
        return <Globe className="w-3.5 h-3.5 text-blue-400" title="Website Contact" />;
      case "TRIAL":
        return <Sparkles className="w-3.5 h-3.5 text-volt-400" title="Trial Booking" />;
      case "WALK_IN":
        return <Footprints className="w-3.5 h-3.5 text-emerald-400" title="Walk-in Enquiry" />;
      case "PHONE":
        return <Phone className="w-3.5 h-3.5 text-amber-400" title="Phone Call" />;
      case "REFERRAL":
        return <Users className="w-3.5 h-3.5 text-purple-400" title="Member Referral" />;
    }
  };

  // Age label
  const ageLabel = React.useMemo(() => {
    try {
      const created = new Date(lead.createdAt).getTime();
      const diffHrs = Math.floor((Date.now() - created) / (1000 * 60 * 60));
      if (diffHrs < 1) return "Just now";
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const days = Math.floor(diffHrs / 24);
      return `${days}d ago`;
    } catch {
      return "Recent";
    }
  }, [lead.createdAt]);

  // Next follow-up label
  const followUpLabel = React.useMemo(() => {
    if (!lead.nextFollowUp) return null;
    try {
      const d = new Date(lead.nextFollowUp);
      return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    } catch {
      return null;
    }
  }, [lead.nextFollowUp]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-2xl border bg-court-500 p-4 transition-all duration-200 select-none",
        overdue
          ? "border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:border-red-500/60"
          : "border-white/14 hover:border-white/28 hover:-translate-y-0.5 shadow-card",
        isDragging && "opacity-40 scale-95 border-volt-400/60 shadow-xl",
        isOverlay && "scale-105 border-volt-400 shadow-2xl rotate-1 cursor-grabbing bg-court-600 z-50",
        !canManage && "cursor-pointer"
      )}
    >
      {/* Top Header: Source, Age, Drag Handle or Lock */}
      <div className="flex items-center justify-between gap-2 mb-2 text-xs text-white/60">
        <div className="flex items-center gap-1.5 bg-white/6 px-2 py-0.5 rounded-full border border-white/10">
          {renderSourceIcon()}
          <span className="capitalize">{lead.source.toLowerCase().replace("_", " ")}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/40">{ageLabel}</span>

          {canManage ? (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="p-1 -mr-1 text-white/30 hover:text-volt-400 cursor-grab active:cursor-grabbing focus:outline-none"
              title="Drag to change stage"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span
              className="p-1 -mr-1 text-white/30 hover:text-white/60"
              title="CRM group required to drag & change stage"
            >
              <Lock className="w-3 h-3 text-white/40" />
            </span>
          )}
        </div>
      </div>

      {/* Main Content: Clickable link to Lead Detail */}
      <div
        onClick={() => go(`/crm/leads/${lead.id}`)}
        className="cursor-pointer space-y-2 focus:outline-none"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && go(`/crm/leads/${lead.id}`)}
      >
        <div>
          <div className="flex items-start justify-between gap-1">
            <h4 className="font-semibold text-white text-sm group-hover:text-volt-400 transition-colors line-clamp-1">
              {lead.name}
            </h4>
          </div>
          {lead.companyName && (
            <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5 line-clamp-1">
              <Building className="w-3 h-3 text-white/40 flex-shrink-0" />
              {lead.companyName}
            </p>
          )}
        </div>

        {/* Interest Chip */}
        <div className="inline-block max-w-full">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-court-600/80 text-white/80 border border-white/10 truncate max-w-full">
            {lead.interest}
          </span>
        </div>

        {/* Bottom Bar: Owner, Overdue / Date, Pipeline Value */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
          {/* Owner Avatar & Name */}
          <div className="flex items-center gap-1.5" title={`Assigned to ${lead.owner}`}>
            <div className="w-6 h-6 rounded-full bg-volt-400/20 border border-volt-400/40 text-volt-400 font-bold text-[10px] flex items-center justify-center">
              {lead.ownerAvatar || lead.owner.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-white/70 text-[11px] truncate max-w-[70px]">
              {lead.owner.split(" ")[0]}
            </span>
          </div>

          {/* Follow-up / Overdue Pill */}
          {overdue ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              <span>⏰ Overdue</span>
            </div>
          ) : followUpLabel ? (
            <div className="flex items-center gap-1 text-[11px] text-white/50">
              <Clock className="w-3 h-3" />
              <span>{followUpLabel}</span>
            </div>
          ) : null}

          {/* Estimated Quote Value */}
          <div className="font-semibold text-volt-400 text-xs">
            <Money amount={lead.estimatedValue} />
          </div>
        </div>
      </div>
    </div>
  );
}
