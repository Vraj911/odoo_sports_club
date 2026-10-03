import { useState, useMemo } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  Package,
  BadgeCheck,
  CreditCard,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AppLink } from "@/app/router/links";
import { useMember } from "@/features/member/memberStore";
import type { NotificationCategory, ClubNotification } from "@/features/member/types";
import { cn } from "@/lib/cn";

const CATEGORIES: ("All" | NotificationCategory)[] = [
  "All",
  "Bookings",
  "Orders",
  "Membership",
  "Payments",
];

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead, unreadCount } = useMember();
  const [selectedCategory, setSelectedCategory] = useState<"All" | NotificationCategory>("All");

  // Filter notifications by category
  const filtered = useMemo(() => {
    if (selectedCategory === "All") return notifications;
    return notifications.filter((n) => n.category === selectedCategory);
  }, [notifications, selectedCategory]);

  // Group by relative day: Today, Yesterday, Earlier
  const grouped = useMemo(() => {
    const today: ClubNotification[] = [];
    const yesterday: ClubNotification[] = [];
    const earlier: ClubNotification[] = [];

    const now = Date.now();
    const oneDay = 86400000;

    filtered.forEach((n) => {
      const diff = now - n.timestamp;
      if (diff < oneDay) {
        today.push(n);
      } else if (diff < oneDay * 2) {
        yesterday.push(n);
      } else {
        earlier.push(n);
      }
    });

    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case "Bookings":
        return <Calendar className="size-4 text-volt-400" />;
      case "Orders":
        return <Package className="size-4 text-emerald-400" />;
      case "Membership":
        return <BadgeCheck className="size-4 text-indigo-400" />;
      case "Payments":
        return <CreditCard className="size-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-chalk/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Bell className="size-6 text-volt-400" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="volt" className="h-6">
                {unreadCount} New
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-chalk/70 mt-1">
            Real-time updates regarding court holds, social spots, bar tabs, and invoices.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllNotificationsRead}
            leftIcon={<CheckCheck className="size-4 text-volt-400" />}
            className="text-xs"
          >
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => {
          const count =
            cat === "All"
              ? notifications.length
              : notifications.filter((n) => n.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-pill px-3.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer",
                selectedCategory === cat
                  ? "bg-volt-400 text-ink-900 font-semibold shadow-volt"
                  : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14 hover:text-chalk"
              )}
            >
              <span>{cat}</span>
              <span className="text-[10px] opacity-70 font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grouped Notifications List */}
      <div className="space-y-6">
        {grouped.length === 0 ? (
          <div className="text-center py-12 rounded-3xl border border-chalk/10 bg-court-500/40 text-chalk/60 text-xs">
            No notifications in this category.
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-chalk/50 font-mono pl-1">
                {group.label}
              </h3>

              <div className="divide-y divide-chalk/8 rounded-[24px] border border-chalk/14 bg-court-500 overflow-hidden shadow-lg">
                {group.items.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={cn(
                      "p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer",
                      !n.read ? "bg-court-600/70" : "hover:bg-white/4"
                    )}
                  >
                    {/* Unread indicator or Category icon */}
                    <div className="flex size-10 items-center justify-center rounded-xl bg-court-700 border border-chalk/10 shrink-0 mt-0.5">
                      {getCategoryIcon(n.category)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-chalk text-sm">{n.title}</h4>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-volt-400 shrink-0" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs text-chalk/70 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-chalk/40 font-mono block mt-1.5">
                        {new Date(n.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {n.category}
                      </span>
                    </div>

                    {n.link && (
                      <AppLink
                        to={n.link}
                        className="text-chalk/40 hover:text-volt-400 self-center p-1"
                      >
                        <ChevronRight className="size-5" />
                      </AppLink>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
