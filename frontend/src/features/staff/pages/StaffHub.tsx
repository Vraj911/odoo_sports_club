import { useState } from "react";
import {
  ClipboardList,
  Wine,
  Store,
  Contact,
  Landmark,
  Settings,
  Clock,
  CalendarClock,
  Plane,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { AppLink } from "@/app/router/links";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import type { PageProps, PermissionGroup } from "@/types/common";

interface LauncherItem {
  group: PermissionGroup;
  title: string;
  description: string;
  path: string;
  badge: string;
  icon: LucideIcon;
  color: string;
}

const LAUNCHERS: LauncherItem[] = [
  {
    group: "FRONT_DESK",
    title: "Front Desk Console",
    description: "Member check-ins, court bookings, walk-in reservations, and desk billing.",
    path: "/desk",
    badge: "Front Desk",
    icon: ClipboardList,
    color: "from-sky-500/20 to-sky-600/10 text-sky-400 border-sky-500/30",
  },
  {
    group: "POS_BAR",
    title: "Courtside Bar & Lounge",
    description: "Table management, open tabs, live bar POS, KDS kitchen orders & shift totals.",
    path: "/bar",
    badge: "POS & Bar",
    icon: Wine,
    color: "from-amber-500/20 to-amber-600/10 text-amber-400 border-amber-500/30",
  },
  {
    group: "SHOP_INVENTORY",
    title: "Pro Shop & Inventory",
    description: "Retail point of sale, gear catalog, stock replenishment & restringing jobs.",
    path: "/shop-console",
    badge: "Shop & Inventory",
    icon: Store,
    color: "from-emerald-500/20 to-emerald-600/10 text-emerald-400 border-emerald-500/30",
  },
  {
    group: "CRM",
    title: "Member CRM & Leads",
    description: "Inbound customer leads, trial bookings, membership follow-ups & campaigns.",
    path: "/crm",
    badge: "CRM",
    icon: Contact,
    color: "from-purple-500/20 to-purple-600/10 text-purple-400 border-purple-500/30",
  },
  {
    group: "FINANCE",
    title: "Finance & Accounts",
    description: "Customer tax invoices, payments, vendor bills, GST filing & P&L statements.",
    path: "/finance",
    badge: "Finance",
    icon: Landmark,
    color: "from-rose-500/20 to-rose-600/10 text-rose-400 border-rose-500/30",
  },
];

export default function StaffHub({}: PageProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [clockedIn, setClockedIn] = useState(true);

  if (!user) return null;

  const userGroups = user.groups || [];

  // Filter launcher cards:
  // Staff sees only their assigned groups.
  const visibleLaunchers = LAUNCHERS.filter((item) =>
    userGroups.includes(item.group)
  );

  const handleToggleClock = () => {
    if (clockedIn) {
      setClockedIn(false);
      toast.info("Clocked Out", "Your shift has been recorded. Enjoy your break!");
    } else {
      setClockedIn(true);
      toast.success("Clocked In", "Active shift started at 09:00 AM.");
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Top Greeting Header */}
      <div className="border-b border-chalk/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-chalk">
              Welcome back, {user.name}
            </h1>
            <span className="rounded-pill border border-chalk/20 bg-chalk/8 px-2.5 py-0.5 text-xs font-medium text-chalk/80">
              Staff Member
            </span>
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Champions Club Operations Portal · Select your assigned terminal or manage your staff shift.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill variant={clockedIn ? "volt" : "neutral"} showDot>
            {clockedIn ? "Shift Active · 4h 15m" : "Shift Inactive"}
          </StatusPill>
          <Button
            size="sm"
            variant={clockedIn ? "secondary" : "primary"}
            onClick={handleToggleClock}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </div>
      </div>

      {/* Main Terminal Launcher Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-4 text-volt-400" />
            <h2 className="text-lg font-semibold text-chalk">Your Operational Terminals</h2>
          </div>
          <span className="text-xs text-chalk/50">
            {visibleLaunchers.length} terminal{visibleLaunchers.length === 1 ? "" : "s"} authorized
          </span>
        </div>

        {visibleLaunchers.length === 0 ? (
          <div className="rounded-[24px] border border-chalk/14 bg-court-600/90 p-12 text-center shadow-xl">
            <EmptyState
              icon={<ShieldAlert className="size-8 text-amber-400" />}
              title="No Access Groups Assigned"
              description="No access groups assigned yet. Ask an admin to assign your permission group."
              action={
                <div className="inline-flex items-center gap-2 text-xs text-chalk/60 bg-chalk/6 px-4 py-2 rounded-pill border border-chalk/10">
                  <AlertCircle className="size-4 text-volt-400" />
                  <span>Contact club management or switch preset in Dev Role Switcher</span>
                </div>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleLaunchers.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.title}
                  className="group relative flex flex-col justify-between overflow-hidden border-chalk/14 bg-court-600/90 hover:border-volt-400/50 hover:bg-court-500/90 transition-all p-6 shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex size-12 items-center justify-center rounded-2xl border bg-gradient-to-br ${item.color}`}
                      >
                        <Icon className="size-6" />
                      </div>
                      <span className="rounded-pill border border-chalk/14 bg-chalk/8 px-2.5 py-0.5 text-[11px] font-medium text-chalk/70">
                        {item.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-chalk group-hover:text-volt-400 transition-colors">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-chalk/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-chalk/10 flex items-center justify-between">
                    <span className="text-xs font-medium text-chalk/60 group-hover:text-chalk transition-colors">
                      Enter terminal
                    </span>
                    <AppLink
                      to={item.path}
                      className="inline-flex items-center gap-1.5 rounded-pill bg-volt-400 px-4 py-1.5 text-xs font-semibold text-ink-900 hover:bg-volt-500 transition-all group-hover:shadow-md group-hover:shadow-volt-400/20"
                    >
                      <span>Open</span>
                      <ArrowRight className="size-3.5" />
                    </AppLink>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Staff Self-Service Shortcut Cards */}
      <div className="pt-4 border-t border-chalk/10">
        <h2 className="text-lg font-semibold text-chalk mb-4">My Self-Service Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: My Shift */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-sky-400" />
                <h4 className="text-sm font-semibold text-chalk">My Shift</h4>
              </div>
              <span className="text-[11px] text-chalk/60 font-mono">09:00 - 17:00</span>
            </div>
            <p className="text-xs text-chalk/70 leading-relaxed">
              Assigned to Court Operations & Front Lobby today. Recorded breaks: 30 mins.
            </p>
            <div className="flex items-center justify-between pt-2 text-xs">
              <span className="text-volt-400 flex items-center gap-1 font-medium">
                <CheckCircle2 className="size-3.5" /> Checked In
              </span>
              <button
                onClick={handleToggleClock}
                className="text-chalk/80 hover:text-chalk underline text-xs"
              >
                {clockedIn ? "End shift" : "Start shift"}
              </button>
            </div>
          </div>

          {/* Card 2: My Roster */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-amber-400" />
                <h4 className="text-sm font-semibold text-chalk">My Roster</h4>
              </div>
              <span className="text-[11px] text-chalk/60">Week 41</span>
            </div>
            <div className="space-y-1 text-xs text-chalk/80 font-mono">
              <div className="flex justify-between">
                <span>Tomorrow</span>
                <span className="text-chalk/60">13:00 - 21:00</span>
              </div>
              <div className="flex justify-between">
                <span>Wednesday</span>
                <span className="text-chalk/40">Weekly Off</span>
              </div>
            </div>
            <div className="pt-2">
              <AppLink
                to="/my"
                className="text-xs text-volt-400 hover:text-volt-300 font-medium flex items-center gap-1"
              >
                <span>View full weekly schedule</span>
                <ChevronRight className="size-3" />
              </AppLink>
            </div>
          </div>

          {/* Card 3: My Leave */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plane className="size-4 text-emerald-400" />
                <h4 className="text-sm font-semibold text-chalk">My Leave</h4>
              </div>
              <span className="text-xs font-semibold text-emerald-400 font-mono">14.5 Days</span>
            </div>
            <p className="text-xs text-chalk/70 leading-relaxed">
              Paid casual & medical leave balance. Next planned leave: None pending approval.
            </p>
            <div className="pt-2">
              <AppLink
                to="/my"
                className="text-xs text-volt-400 hover:text-volt-300 font-medium flex items-center gap-1"
              >
                <span>Request time off</span>
                <ChevronRight className="size-3" />
              </AppLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
