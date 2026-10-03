import { useState, useEffect } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { KDSTicketCard } from "../components/KDSTicketCard";
import { PrepStation } from "../types";
import {
  ChefHat,
  Wine,
  Volume2,
  VolumeX,
  ArrowLeft,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export function KDSPage() {
  const go = useGo();
  const {
    orders,
    updateKDSLineStatus,
    soundChimeEnabled,
    toggleSoundChime,
    simulateIncomingOrder,
  } = useBarStore();

  const [stationFilter, setStationFilter] = useState<"ALL" | "KITCHEN" | "BAR">("ALL");

  // Filter orders that have non-voided, non-served items matching station
  const activeOrders = orders.filter((order) => {
    return order.items.some((item) => {
      if (item.status === "VOIDED" || item.status === "SERVED") return false;
      if (stationFilter === "ALL") return true;
      return item.station === stationFilter;
    });
  });

  // Categorize orders into NEW, PREPARING, READY
  const newOrders = activeOrders.filter((o) =>
    o.items.some((i) => i.status === "NEW" || i.status === "SENT")
  );

  const preparingOrders = activeOrders.filter((o) =>
    o.items.some((i) => i.status === "PREPARING") && !newOrders.includes(o)
  );

  const readyOrders = activeOrders.filter((o) =>
    o.items.every((i) => i.status === "READY" || i.status === "SERVED" || i.status === "VOIDED")
  );

  const handleAdvanceTicket = (orderId: string, targetStatus: "PREPARING" | "READY" | "SERVED") => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    order.items.forEach((item) => {
      if (item.status !== "VOIDED" && item.status !== "SERVED") {
        if (stationFilter === "ALL" || item.station === stationFilter) {
          updateKDSLineStatus(orderId, item.lineId, targetStatus);
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-navy-950 text-white flex flex-col font-sans">
      {/* KDS Dark Top Bar */}
      <div className="bg-navy-900/90 border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand + Back */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => go("/bar")}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Floor View</span>
          </button>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-volt-400 text-ink-900 flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black font-heading tracking-wide uppercase flex items-center gap-2">
                <span>Kitchen & Bar Display</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  ● Realtime KDS
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Center: Station Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-navy-800 p-1 rounded-2xl border border-white/10">
          <button
            onClick={() => setStationFilter("ALL")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              stationFilter === "ALL"
                ? "bg-volt-400 text-ink-900 shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            All Stations ({activeOrders.length})
          </button>
          <button
            onClick={() => setStationFilter("KITCHEN")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              stationFilter === "KITCHEN"
                ? "bg-amber-400 text-ink-900 shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Food
          </button>
          <button
            onClick={() => setStationFilter("BAR")}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              stationFilter === "BAR"
                ? "bg-cyan-400 text-ink-900 shadow-md"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            Bar Drinks
          </button>
        </div>

        {/* Right: Audio Chime & Order Simulator */}
        <div className="flex items-center gap-2">
          {/* Incoming Order Simulator button */}
          <Button
            variant="outline"
            size="sm"
            onClick={simulateIncomingOrder}
            className="h-8 text-xs border-volt-400/30 text-volt-300 hover:bg-volt-400/10"
            title="Simulate extra incoming order"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-volt-400" />
            + New Ticket (Simulate)
          </Button>

          {/* Sound Chime Toggle */}
          <button
            onClick={toggleSoundChime}
            className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-colors ${
              soundChimeEnabled
                ? "bg-white/10 text-volt-300 border-volt-400/30"
                : "bg-white/5 text-white/40 border-white/10"
            }`}
            title="Toggle new ticket audible chime"
          >
            {soundChimeEnabled ? <Volume2 className="w-4 h-4 text-volt-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">Chime</span>
          </button>
        </div>
      </div>

      {/* 3 Columns Kanban Board */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        {/* Column 1: NEW TICKETS */}
        <div className="flex flex-col bg-navy-900/60 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 bg-court-700/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
              <h2 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                New Orders
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold font-mono">
              {newOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {newOrders.map((order) => (
              <KDSTicketCard
                key={order.id}
                order={order}
                stationFilter={stationFilter}
                onUpdateLineStatus={updateKDSLineStatus}
                onAdvanceTicket={handleAdvanceTicket}
              />
            ))}

            {newOrders.length === 0 && (
              <div className="py-20 text-center text-white/30 text-xs">
                No new incoming orders at this station.
              </div>
            )}
          </div>
        </div>

        {/* Column 2: PREPARING (Cooking / Brewing) */}
        <div className="flex flex-col bg-navy-900/60 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 bg-court-700/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <h2 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                Preparing
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
              {preparingOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {preparingOrders.map((order) => (
              <KDSTicketCard
                key={order.id}
                order={order}
                stationFilter={stationFilter}
                onUpdateLineStatus={updateKDSLineStatus}
                onAdvanceTicket={handleAdvanceTicket}
              />
            ))}

            {preparingOrders.length === 0 && (
              <div className="py-20 text-center text-white/30 text-xs">
                All tickets prepared. Ready for next order.
              </div>
            )}
          </div>
        </div>

        {/* Column 3: READY FOR PASS / SERVING */}
        <div className="flex flex-col bg-navy-900/60 rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-4 py-3 bg-court-700/60 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-volt-400" />
              <h2 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                Ready to Pass
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-volt-400/20 text-volt-300 text-xs font-bold font-mono">
              {readyOrders.length}
            </span>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3">
            {readyOrders.map((order) => (
              <KDSTicketCard
                key={order.id}
                order={order}
                stationFilter={stationFilter}
                onUpdateLineStatus={updateKDSLineStatus}
                onAdvanceTicket={handleAdvanceTicket}
              />
            ))}

            {readyOrders.length === 0 && (
              <div className="py-20 text-center text-white/30 text-xs">
                No tickets waiting on the pass.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default KDSPage;
