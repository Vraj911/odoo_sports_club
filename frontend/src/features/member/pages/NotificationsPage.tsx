import { useState, useMemo, useEffect } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  Package,
  BadgeCheck,
  CreditCard,
  ChevronRight,
  Trash2,
  RotateCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AppLink, useGo } from "@/app/router/links";
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
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    unreadCount,
    loadNotifications,
  } = useMember();
  const [selectedCategory, setSelectedCategory] = useState<"All" | NotificationCategory>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const go = useGo();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

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

  const formatTimestamp = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="border-b border-chalk/10 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-volt-400/10 border border-volt-400/20 text-volt-400">
              <Bell className="size-5" />
            </div>
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
            Real-time notifications for court reservations, tournament schedules, invoices, and club privileges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RotateCw className={cn("size-3.5 text-chalk/70", isRefreshing && "animate-spin")} />}
            className="text-xs"
          >
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllNotificationsRead}
              leftIcon={<CheckCheck className="size-4 text-volt-400" />}
              className="text-xs"
            >
              Mark All Read
            </Button>
          )}
        </div>
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
          <div className="flex flex-col items-center justify-center text-center py-16 rounded-3xl border border-chalk/10 bg-court-500/40 p-8 space-y-3">
            <div className="flex size-14 items-center justify-center rounded-full bg-chalk/5 border border-chalk/10 text-chalk/40">
              <Bell className="size-6" />
            </div>
            <h3 className="text-sm font-semibold text-chalk">No notifications in this view</h3>
            <p className="text-xs text-chalk/60 max-w-sm">
              You are all caught up! New updates will appear here in real-time when court bookings, invoices, or club events are processed.
            </p>
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
                    className={cn(
                      "group p-4 sm:p-5 flex items-start gap-4 transition-colors",
                      !n.read ? "bg-court-600/70" : "hover:bg-white/4"
                    )}
                  >
                    {/* Category Icon */}
                    <div
                      onClick={() => markNotificationRead(n.id)}
                      className="flex size-10 items-center justify-center rounded-xl bg-court-700 border border-chalk/10 shrink-0 mt-0.5 cursor-pointer"
                    >
                      {getCategoryIcon(n.category)}
                    </div>

                    <div
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.link) go(n.link);
                      }}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-chalk text-sm">{n.title}</h4>
                        {!n.read && (
                          <span className="size-2 rounded-full bg-volt-400 shrink-0" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs text-chalk/70 mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-chalk/40 font-mono block mt-1.5">
                        {formatTimestamp(n.timestamp)} · {n.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(n.id);
                        }}
                        title="Delete notification"
                        className="opacity-0 group-hover:opacity-100 p-2 text-chalk/40 hover:text-danger rounded-lg transition-all"
                      >
                        <Trash2 className="size-4" />
                      </button>

                      {n.link && (
                        <AppLink
                          to={n.link}
                          onClick={() => markNotificationRead(n.id)}
                          className="text-chalk/40 hover:text-volt-400 p-2 rounded-lg transition-colors"
                          title="Open details"
                        >
                          <ChevronRight className="size-5" />
                        </AppLink>
                      )}
                    </div>
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
