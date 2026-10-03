import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useBarStore } from "../barStore";
import { Beer, Lock, Clock, ChefHat, LogOut, Wine, PlusCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/app/providers/AuthProvider";

interface FloorHeaderProps {
  onNewOrderNoTable?: () => void;
  activeTabFilter?: string;
  onFilterChange?: (filter: string) => void;
  showFilters?: boolean;
}

export function FloorHeader({
  onNewOrderNoTable,
  activeTabFilter,
  onFilterChange,
  showFilters = false,
}: FloorHeaderProps) {
  const go = useGo();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const { activeShift, tabs, clockInOutShift, dailyClosing } = useBarStore();
  const openTabsCount = tabs.filter((t) => t.status === "OPEN").length;

  return (
    <div className="w-full bg-court-700/80 backdrop-blur-md border-b border-white/10 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand + Module Title */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => go("/bar")}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-xl bg-volt-400 text-ink-900 flex items-center justify-center font-bold shadow-md shadow-volt-400/20">
              <Wine className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-white text-base tracking-wide">
                  Bar & Café POS
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-volt-400/20 text-volt-300 border border-volt-400/30">
                  Floor View
                </span>
              </div>
              <p className="text-[11px] text-white/50">Clubhouse Lounge & Courtside</p>
            </div>
          </div>

          {/* Shift Info */}
          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10 text-xs text-white/70">
            <Clock className="w-3.5 h-3.5 text-volt-400" />
            <span>
              Shift: <strong className="text-white">{activeShift.staffName}</strong> · started{" "}
              {activeShift.clockInTime}
            </span>
            <button
              onClick={() => {
                const res = clockInOutShift("1234");
                alert(res.message);
              }}
              className="text-[11px] text-white/40 hover:text-danger flex items-center gap-1 ml-1 hover:underline"
              title="Clock in / out"
            >
              <LogOut className="w-3 h-3" />
              Clock out
            </button>
          </div>
        </div>

        {/* Center / Right Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Quick No-table order */}
          {onNewOrderNoTable && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNewOrderNoTable}
              className="border-volt-400/30 text-volt-300 hover:bg-volt-400/10 text-xs h-8"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              + Quick Order (No Table)
            </Button>
          )}

          {/* Open Tabs Pill */}
          <button
            onClick={() => go("/bar/tabs")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-court-600/70 hover:bg-court-500 border border-white/10 text-xs text-white transition-colors"
          >
            <Beer className="w-3.5 h-3.5 text-amber-400" />
            <span>Open tabs</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold">
              {openTabsCount}
            </span>
          </button>

          {/* KDS Button */}
          <button
            onClick={() => go("/kds")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-court-600/70 hover:bg-court-500 border border-white/10 text-xs text-white transition-colors"
          >
            <ChefHat className="w-3.5 h-3.5 text-volt-400" />
            <span>KDS</span>
          </button>

          {/* Shift Page */}
          <button
            onClick={() => go("/bar/shift")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-court-600/70 hover:bg-court-500 border border-white/10 text-xs text-white transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-white/70" />
            <span className="hidden md:inline">Shift</span>
          </button>

          {/* Daily Closing Button (ADMIN only) */}
          <button
            onClick={() => {
              if (isAdmin) {
                go("/bar/closing");
              } else {
                alert("Access Restricted: Daily Closing (Z-Report) requires ADMIN authorization. Staff can view shift summary in /bar/shift.");
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isAdmin
                ? "bg-volt-400/15 text-volt-300 hover:bg-volt-400/25 border border-volt-400/30"
                : "bg-white/5 text-white/50 hover:bg-white/10 border border-white/10"
            }`}
            title={isAdmin ? "Daily Closing Z-Report" : "Admin approval required for Daily Closing"}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Daily closing</span>
            {!isAdmin && (
              <span className="text-[10px] text-white/40 bg-white/10 px-1 rounded">Admin</span>
            )}
          </button>

          {/* Live indicator badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
        </div>
      </div>

      {/* Unsettled Tabs closing warning banner if applicable */}
      {openTabsCount > 0 && dailyClosing.unsettledTabsCount > 0 && (
        <div className="mt-2 max-w-7xl mx-auto py-1.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>{openTabsCount} unsettled tabs</strong> currently open. Settle or move to member
              accounts before daily closing.
            </span>
          </div>
          <button
            onClick={() => go("/bar/tabs")}
            className="underline font-semibold hover:text-white"
          >
            Manage Tabs →
          </button>
        </div>
      )}
    </div>
  );
}
