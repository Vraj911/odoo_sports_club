import { useState, useEffect } from "react";
import { BarOrder, OrderLineItem, PrepStation } from "../types";
import { Clock, CheckCircle2, Flame, ChefHat, Wine, BellRing } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface KDSTicketCardProps {
  order: BarOrder;
  stationFilter: "ALL" | "KITCHEN" | "BAR";
  onUpdateLineStatus: (orderId: string, lineId: string, newStatus: "PREPARING" | "READY" | "SERVED") => void;
  onAdvanceTicket: (orderId: string, targetStatus: "PREPARING" | "READY" | "SERVED") => void;
}

export function KDSTicketCard({
  order,
  stationFilter,
  onUpdateLineStatus,
  onAdvanceTicket,
}: KDSTicketCardProps) {
  // Filter items matching the KDS station filter
  const items = order.items.filter((item) => {
    if (item.status === "VOIDED" || item.status === "SERVED") return false;
    if (stationFilter === "ALL") return true;
    return item.station === stationFilter;
  });

  if (items.length === 0) return null;

  // Track live timer in MM:SS
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const startTime = order.items[0]?.sentAt
      ? new Date(order.items[0].sentAt).getTime()
      : new Date(order.createdAt).getTime();

    const updateTimer = () => {
      const diffSec = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  const timerFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Acceptance criteria timer colors:
  // < 5 min: white
  // 5 - 10 min: amber
  // > 10 min: red pulse
  let timerStyle = "text-white border-white/20 bg-court-600/70";
  let cardBorder = "border-white/15";
  let pulseEffect = "";

  if (minutes >= 10) {
    timerStyle = "text-red-300 border-red-500/50 bg-red-950/40 animate-pulse font-black";
    cardBorder = "border-red-500/70 shadow-lg shadow-red-500/20";
    pulseEffect = "animate-pulse";
  } else if (minutes >= 5) {
    timerStyle = "text-amber-300 border-amber-500/50 bg-amber-950/30 font-bold";
    cardBorder = "border-amber-500/50 shadow-md shadow-amber-500/10";
  }

  // Determine stage of ticket
  const allReady = items.every((i) => i.status === "READY");
  const anyPreparing = items.some((i) => i.status === "PREPARING");
  const anyNew = items.some((i) => i.status === "NEW" || i.status === "SENT");

  const destinationLabel =
    order.destination.type === "TABLE"
      ? `Table ${order.tableId?.replace("T", "")}`
      : order.destination.type === "COURT"
      ? `${order.destination.targetId}`
      : `${order.destination.targetId}`;

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl bg-court-700/90 backdrop-blur-md border ${cardBorder} p-4 transition-all duration-200`}
    >
      {/* Ticket Header: Large Table/Dest (≥20px) + Waiter + Timer */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black font-heading text-white tracking-wide">
                {destinationLabel}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">
                #{order.orderNumber}
              </span>
            </div>

            {/* Waiter initials + Customer Name */}
            <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
              <span className="w-5 h-5 rounded-full bg-volt-400 text-ink-900 font-bold text-[10px] flex items-center justify-center">
                {order.waiterInitials}
              </span>
              <span>{order.waiterName}</span>
              {order.customer?.name && (
                <>
                  <span>·</span>
                  <span className="text-volt-300 font-medium truncate max-w-[120px]">
                    {order.customer.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Elapsed Timer Pill (Dynamic color & pulse) */}
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-base font-mono font-bold tracking-wider ${timerStyle}`}
          >
            <Clock className={`w-4 h-4 ${minutes >= 10 ? "text-red-400" : minutes >= 5 ? "text-amber-400" : "text-white"}`} />
            <span>⏱ {timerFormatted}</span>
          </div>
        </div>

        {/* Line Items List */}
        <div className="py-3 space-y-2.5">
          {items.map((line) => {
            const isReady = line.status === "READY";
            const isPreparing = line.status === "PREPARING";

            return (
              <div
                key={line.lineId}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isReady
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                    : isPreparing
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-volt-300 font-mono">
                      {line.quantity}×
                    </span>
                    <div>
                      <span className="text-base font-semibold text-white">
                        {line.name}
                      </span>
                      {/* Station pill */}
                      <span
                        className={`ml-2 text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          line.station === "KITCHEN"
                            ? "bg-amber-400/20 text-amber-300"
                            : "bg-cyan-400/20 text-cyan-300"
                        }`}
                      >
                        {line.station}
                      </span>
                    </div>
                  </div>

                  {/* Status chip */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      isReady
                        ? "bg-volt-400 text-ink-900"
                        : isPreparing
                        ? "bg-amber-400 text-ink-900"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {line.status}
                  </span>
                </div>

                {/* Modifiers & Notes */}
                {(line.notes || (line.modifiers && line.modifiers.length > 0)) && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 text-xs text-volt-300/90 font-medium">
                    {line.modifiers && line.modifiers.length > 0 && (
                      <span className="block italic">
                        Preference: {line.modifiers.join(", ")}
                      </span>
                    )}
                    {line.notes && (
                      <span className="block font-mono text-amber-300 text-[11px]">
                        Note: "{line.notes}"
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ticket Footer Action Buttons */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
        {anyNew && (
          <Button
            size="sm"
            onClick={() => onAdvanceTicket(order.id, "PREPARING")}
            className="flex-1 bg-amber-400 hover:bg-amber-500 text-ink-900 font-bold h-10 text-xs"
          >
            <Flame className="w-4 h-4 mr-1.5" />
            START PREP
          </Button>
        )}

        {anyPreparing && !allReady && (
          <Button
            size="sm"
            onClick={() => onAdvanceTicket(order.id, "READY")}
            className="flex-1 bg-volt-400 hover:bg-volt-500 text-ink-900 font-bold h-10 text-xs shadow-md shadow-volt-400/20"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            MARK READY ✓
          </Button>
        )}

        {allReady && (
          <Button
            size="sm"
            onClick={() => onAdvanceTicket(order.id, "SERVED")}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-10 text-xs"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            DISMISS / SERVED
          </Button>
        )}
      </div>
    </div>
  );
}
