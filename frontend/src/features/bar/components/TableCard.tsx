import { ClubTable, BarOrder } from "../types";
import { Users, Clock, Receipt, CheckCircle2, MoreVertical, Flame } from "lucide-react";

interface TableCardProps {
  table: ClubTable;
  order?: BarOrder;
  onClick: () => void;
  onQuickAction?: (action: "TRANSFER" | "BILL" | "RESERVE") => void;
}

export function TableCard({ table, order, onClick, onQuickAction }: TableCardProps) {
  // Format elapsed time
  let elapsedMinutes = 0;
  if (table.occupiedSince) {
    const diffMs = Date.now() - new Date(table.occupiedSince).getTime();
    elapsedMinutes = Math.max(1, Math.floor(diffMs / 60000));
  }

  const getStatusColor = (status: ClubTable["status"]) => {
    switch (status) {
      case "FREE":
        return {
          border: "border-white/10 hover:border-volt-400/40",
          badge: "bg-white/10 text-white/70 border-white/20",
          dot: "bg-white/40",
          label: "FREE",
        };
      case "OCCUPIED":
        return {
          border: "border-court-400/50 hover:border-court-300 bg-court-600/70",
          badge: "bg-volt-400/15 text-volt-300 border-volt-400/30",
          dot: "bg-volt-400",
          label: "OCCUPIED",
        };
      case "BILL_REQUESTED":
        return {
          border: "border-amber-400/60 hover:border-amber-300 bg-amber-500/10 shadow-lg shadow-amber-500/10",
          badge: "bg-amber-400/20 text-amber-300 border-amber-400/40 animate-pulse",
          dot: "bg-amber-400",
          label: "BILL REQUESTED",
        };
      case "RESERVED":
        return {
          border: "border-purple-400/40 hover:border-purple-300 bg-purple-500/10",
          badge: "bg-purple-400/20 text-purple-300 border-purple-400/30",
          dot: "bg-purple-400",
          label: "RESERVED",
        };
    }
  };

  const statusStyle = getStatusColor(table.status);
  const activeItemsCount = order?.items.filter((i) => i.status !== "VOIDED").length || 0;
  const runningTotal = order?.total || 0;

  return (
    <div
      onClick={onClick}
      className={`relative group flex flex-col justify-between p-4 rounded-2xl bg-court-600/60 backdrop-blur-sm border transition-all duration-200 cursor-pointer hover:-translate-y-1 hover:shadow-xl ${statusStyle.border}`}
    >
      {/* Table Top: Number + Status Pill */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold font-heading text-white">{table.id}</span>
            <span className="text-xs text-white/50 flex items-center gap-1 font-medium">
              <Users className="w-3.5 h-3.5" />
              {table.seats} seats
            </span>
          </div>
          <span className="text-[11px] text-white/40 block mt-0.5">{table.section.replace("_", " ")}</span>
        </div>

        {/* Status Pill */}
        <div
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border flex items-center gap-1.5 shrink-0 ${statusStyle.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          <span>{statusStyle.label}</span>
        </div>
      </div>

      {/* Center Details when Occupied */}
      {table.status !== "FREE" && table.status !== "RESERVED" && (
        <div className="my-3 space-y-2">
          {/* Running total and items count */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-white/60">
              {activeItemsCount} item{activeItemsCount !== 1 ? "s" : ""}
            </span>
            <span className="text-lg font-bold text-volt-300 font-mono">
              ₹{runningTotal.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Waiter initials & Elapsed time */}
          <div className="flex items-center justify-between text-xs text-white/50 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-white/40" />
              <span>
                {elapsedMinutes >= 60
                  ? `${Math.floor(elapsedMinutes / 60)}h ${elapsedMinutes % 60}m`
                  : `${elapsedMinutes}m`}
              </span>
            </div>
            {table.waiterInitials && (
              <span
                className="w-5 h-5 rounded-full bg-white/10 text-white/80 font-bold text-[10px] flex items-center justify-center border border-white/15"
                title={`Waiter: ${table.waiterName || table.waiterInitials}`}
              >
                {table.waiterInitials}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Free table placeholder */}
      {table.status === "FREE" && (
        <div className="my-4 py-2 flex flex-col items-center justify-center text-white/30 text-xs">
          <span>Tap to seat & take order</span>
        </div>
      )}

      {/* Reserved Table info */}
      {table.status === "RESERVED" && (
        <div className="my-3 py-2 text-center text-xs text-purple-200/70">
          <span>Reserved for dinner cover</span>
        </div>
      )}

      {/* Bottom Indicators & Badges */}
      <div className="flex items-center justify-between gap-1 pt-1">
        {/* KDS Ready items badge (volt pill) */}
        {table.readyItemsCount && table.readyItemsCount > 0 ? (
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-volt-400 text-ink-900 text-xs font-bold shadow-md shadow-volt-400/25 animate-bounce">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{table.readyItemsCount} ready ✓</span>
          </div>
        ) : (
          <div />
        )}

        {/* Multi-staff editing chip */}
        {table.activeStaffEditing && (
          <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-400" />
            {table.activeStaffEditing}
          </span>
        )}
      </div>
    </div>
  );
}
