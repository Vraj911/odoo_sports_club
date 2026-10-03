import { useState, useEffect } from "react";
import {
  Bell,
  Calendar,
  Clock,
  QrCode,
  ArrowRight,
  CalendarPlus,
  Users,
  ShoppingBag,
  Beer,
  AlertTriangle,
  XCircle,
  CreditCard,
  ChevronRight,
  Sparkles,
  Receipt,
  Package,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Money } from "@/components/shared/Money";
import { CourtLines } from "@/components/brand/CourtLines";
import { useMember } from "@/features/member/memberStore";
import { useMemberBookings } from "@/features/booking/bookingStore";
import { BookingQRModal } from "@/features/member/components/BookingQRModal";
import type { Booking } from "@/features/booking/types";

export default function MemberDashboard() {
  const { profile, orders, notifications, unreadCount, renewMembership } = useMember();
  const { tabBalance, tabLimit } = profile;
  const { bookings } = useMemberBookings();

  const [loading, setLoading] = useState(true);
  const [selectedQRBooking, setSelectedQRBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  // Find next upcoming confirmed booking
  const nextBooking = bookings.find((b) => b.status === "CONFIRMED");

  // Status banner condition
  const isExpiringSoon = profile.status === "EXPIRING_SOON";
  const isExpired = profile.status === "EXPIRED";
  const isPendingPayment = profile.status === "PENDING_PAYMENT";

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-64 bg-chalk/10 rounded-2xl" />
        <Skeleton className="h-44 w-full bg-chalk/10 rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 bg-chalk/10 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Greeting & Notifications Bell */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">
            Hi, {profile.name.split(" ")[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-chalk/70 mt-0.5">
            Welcome back to Champions Club. Here is your daily club digest.
          </p>
        </div>

        <AppLink
          to="/app/notifications"
          className="relative flex size-11 items-center justify-center rounded-2xl border border-chalk/14 bg-court-600 text-chalk hover:bg-court-700 hover:text-volt-400 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-volt-400 text-ink-900 font-bold text-[10px] shadow-volt">
              {unreadCount}
            </span>
          )}
        </AppLink>
      </div>

      {/* ── Status Banners for Membership State ── */}
      {isExpiringSoon && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/15 p-4 text-amber-200 shadow-md">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                Membership Expiring Soon ({profile.daysRemaining} days remaining)
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                Your {profile.tier} benefits expire on {profile.validTill}. Renew now to keep your complimentary court benefits.
              </p>
            </div>
          </div>
          <AppLink to="/app/membership">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Renew Now
            </Button>
          </AppLink>
        </div>
      )}

      {isExpired && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-danger/40 bg-danger/15 p-4 text-danger shadow-md">
          <div className="flex items-center gap-3">
            <XCircle className="size-5 text-danger shrink-0" />
            <div>
              <p className="text-sm font-semibold text-chalk">
                Membership Expired on {profile.validTill}
              </p>
              <p className="text-xs text-chalk/80 mt-0.5">
                You're currently treated as a guest with standard public rates until you renew.
              </p>
            </div>
          </div>
          <AppLink to="/app/membership">
            <Button variant="danger" size="sm" className="whitespace-nowrap">
              Renew Now
            </Button>
          </AppLink>
        </div>
      )}

      {isPendingPayment && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-volt-400/40 bg-volt-400/15 p-4 text-volt-400 shadow-md">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-volt-400 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-chalk">
                Membership Activation Pending
              </p>
              <p className="text-xs text-chalk/80 mt-0.5">
                Complete subscription payment to activate your {profile.tier} access and complimentary bookings.
              </p>
            </div>
          </div>
          <AppLink to="/app/membership">
            <Button variant="primary" size="sm" className="whitespace-nowrap">
              Complete Payment · ₹18,000
            </Button>
          </AppLink>
        </div>
      )}

      {/* ── Membership Card (court-500, CourtLines faint) ── */}
      <div className="relative overflow-hidden rounded-[24px] border border-chalk/18 bg-court-500 p-6 sm:p-7 shadow-xl">
        {/* Subtle background CourtLines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <CourtLines className="w-full h-full object-cover scale-110" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusPill
                variant={
                  profile.tier === "Gold"
                    ? "volt"
                    : profile.tier === "Silver"
                    ? "neutral"
                    : "info"
                }
                className="text-xs uppercase tracking-wider font-semibold"
              >
                {profile.tier} Member
              </StatusPill>
              <span className="text-xs font-mono font-medium text-chalk/60">
                · Member ID {profile.id}
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-chalk">
                {profile.name}
              </h2>
              <p className="text-xs text-chalk/70 mt-1 font-mono flex items-center gap-2">
                <span>Expires {new Date(profile.validTill).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span>·</span>
                <span className={profile.daysRemaining <= 15 ? "text-amber-400 font-bold" : "text-volt-400 font-medium"}>
                  ◔ {profile.daysRemaining} days left
                </span>
              </p>
            </div>
          </div>

          {/* Progress Ring / Days Meter & Action */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-2xl bg-court-600/70 border border-chalk/10 p-3.5 px-4">
              <div className="relative flex size-12 items-center justify-center">
                <svg className="size-full rotate-[-90deg]" viewBox="0 0 36 36">
                  <path
                    className="text-chalk/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={profile.daysRemaining <= 15 ? "text-amber-400" : "text-volt-400"}
                    strokeDasharray={`${Math.min(100, Math.round((profile.daysRemaining / 365) * 100))}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute font-mono text-[11px] font-bold text-chalk">
                  {Math.round((profile.daysRemaining / 365) * 100)}%
                </span>
              </div>
              <div className="text-xs">
                <span className="text-chalk/50 block text-[10px] uppercase tracking-wider">Plan Term</span>
                <span className="font-semibold text-chalk">{profile.daysRemaining} days active</span>
              </div>
            </div>

            <AppLink to="/app/card">
              <Button variant="secondary" size="sm" leftIcon={<QrCode className="size-4" />}>
                View Card
              </Button>
            </AppLink>

            {(isExpiringSoon || isExpired) && (
              <AppLink to="/app/membership">
                <Button variant="primary" size="sm">
                  Renew
                </Button>
              </AppLink>
            )}
          </div>
        </div>

        {/* Entitlements Chips */}
        <div className="relative z-10 mt-6 border-t border-chalk/10 pt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] font-medium text-chalk/50 uppercase tracking-wider mr-1">
            Entitlements:
          </span>
          <span className="rounded-pill bg-volt-400/15 border border-volt-400/30 px-3 py-1 font-semibold text-volt-400">
            Court: {profile.entitlements.courtRate === 0 ? "₹0 Free" : `₹${profile.entitlements.courtRate}`}
          </span>
          <span className="rounded-pill bg-chalk/8 border border-chalk/14 px-3 py-1 text-chalk/90">
            Shop {profile.entitlements.shopDiscount}% off
          </span>
          <span className="rounded-pill bg-chalk/8 border border-chalk/14 px-3 py-1 text-chalk/90">
            Bar & Lounge {profile.entitlements.barDiscount}% off
          </span>
          <span className="rounded-pill bg-chalk/8 border border-chalk/14 px-3 py-1 text-chalk/90 font-mono">
            {profile.entitlements.advanceBookingDays}-day window
          </span>
          <span className="rounded-pill bg-chalk/8 border border-chalk/14 px-3 py-1 text-chalk/90">
            {profile.entitlements.guestPasses} Guest Passes
          </span>
        </div>
      </div>

      {/* ── Next Booking Banner ── */}
      {nextBooking && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-chalk/14 bg-court-600/70 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-court-500 border border-chalk/14 text-2xl">
              🎾
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-volt-400">
                  Next Scheduled Court
                </span>
                <span className="rounded-pill bg-volt-400/15 px-2 py-0.5 text-[10px] font-mono text-volt-400 font-semibold">
                  ⏱ in 2h 10m
                </span>
              </div>
              <h3 className="text-base font-bold text-chalk mt-0.5">
                {nextBooking.courtName} · Today {nextBooking.startTime}–{nextBooking.endTime}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedQRBooking(nextBooking)}
              leftIcon={<QrCode className="size-3.5" />}
            >
              QR Check-in
            </Button>
            <AppLink to={`/app/bookings/${nextBooking.id}`}>
              <Button variant="ghost" size="sm" rightIcon={<ChevronRight className="size-3.5" />}>
                Details
              </Button>
            </AppLink>
          </div>
        </div>
      )}

      {/* ── Quick Actions (4 Tiles) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            title: "Book Court",
            desc: "Reserve a tennis, padel or cricket slot",
            icon: CalendarPlus,
            to: "/app/book",
            accent: "hover:border-volt-400/50",
          },
          {
            title: "Social Play",
            desc: "Join Friday mixers & Americano",
            icon: Users,
            to: "/app/social",
            accent: "hover:border-indigo-400/50",
          },
          {
            title: "Pro Shop",
            desc: "15% off rackets, balls & gear",
            icon: ShoppingBag,
            to: "/app/shop",
            accent: "hover:border-emerald-400/50",
          },
          {
            title: "My Bar Tab",
            desc: "Courtside drinks & kitchen orders",
            icon: Beer,
            to: "/app/tab",
            accent: "hover:border-amber-400/50",
          },
        ].map((tile) => {
          const Icon = tile.icon;
          return (
            <AppLink
              key={tile.to}
              to={tile.to}
              className={`group flex flex-col justify-between rounded-2xl border border-chalk/14 bg-court-500 p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-card ${tile.accent}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-court-600 border border-chalk/10 text-volt-400 group-hover:scale-110 transition-transform">
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-chalk/40 group-hover:text-volt-400 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="mt-4">
                <h4 className="text-sm font-bold text-chalk group-hover:text-volt-400 transition-colors">
                  {tile.title}
                </h4>
                <p className="text-[11px] text-chalk/60 mt-0.5 line-clamp-1">{tile.desc}</p>
              </div>
            </AppLink>
          );
        })}
      </div>

      {/* ── Open Tab + Recent Orders & Notifications Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Bar Tab Tile */}
        <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Beer className="size-5 text-amber-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
                Courtside Bar Tab
              </h3>
            </div>
            <StatusPill variant="warning" className="text-[11px]">
              Open
            </StatusPill>
          </div>

          <div className="space-y-1">
            <span className="text-chalk/60 text-xs">Current Running Balance:</span>
            <div className="text-2xl font-bold font-mono text-volt-400">
              <Money amount={tabBalance} />
            </div>
            <div className="flex justify-between text-[11px] text-chalk/50 font-mono pt-1">
              <span>Limit: ₹{tabLimit}</span>
              <span>{Math.round((tabBalance / tabLimit) * 100)}% utilized</span>
            </div>
            {/* Progress bar */}
            <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden mt-1">
              <div
                className="h-full bg-volt-400 rounded-full"
                style={{ width: `${Math.min(100, (tabBalance / tabLimit) * 100)}%` }}
              />
            </div>
          </div>

          <AppLink to="/app/tab" className="pt-2">
            <Button variant="secondary" size="sm" className="w-full">
              View & Settle Tab
            </Button>
          </AppLink>
        </div>

        {/* Recent Orders */}
        <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
            <div className="flex items-center gap-2">
              <Package className="size-4 text-volt-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
                Recent Orders ({orders.length})
              </h3>
            </div>
            <AppLink to="/app/orders" className="text-xs text-volt-400 hover:underline">
              View all
            </AppLink>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 2).map((order) => (
              <AppLink
                key={order.id}
                to={`/app/orders/${order.id}`}
                className="flex items-center justify-between rounded-xl bg-court-600/60 p-3 hover:bg-court-600 transition-colors border border-chalk/8 text-xs"
              >
                <div>
                  <span className="font-semibold text-chalk block">
                    #{order.id} · {order.items[0]?.name}
                  </span>
                  <span className="text-[11px] text-chalk/50 font-mono">
                    {order.date} · <Money amount={order.total} />
                  </span>
                </div>
                <StatusPill
                  variant={order.status === "READY_FOR_PICKUP" ? "volt" : "success"}
                  className="text-[10px]"
                >
                  {order.status.replace(/_/g, " ")}
                </StatusPill>
              </AppLink>
            ))}
          </div>
        </div>

        {/* Notifications Digest */}
        <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-volt-400" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
                Notifications ({unreadCount} unread)
              </h3>
            </div>
            <AppLink to="/app/notifications" className="text-xs text-volt-400 hover:underline">
              Inbox
            </AppLink>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 3).map((ntf) => (
              <div
                key={ntf.id}
                className="flex items-start gap-2.5 rounded-xl bg-court-600/60 p-3 border border-chalk/8 text-xs"
              >
                {!ntf.read && (
                  <span className="size-2 rounded-full bg-volt-400 shrink-0 mt-1" />
                )}
                <div className="min-w-0 flex-1">
                  <h5 className="font-semibold text-chalk truncate">{ntf.title}</h5>
                  <p className="text-[11px] text-chalk/60 line-clamp-1 mt-0.5">
                    {ntf.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* QR Modal for next booking */}
      <BookingQRModal
        booking={selectedQRBooking}
        isOpen={Boolean(selectedQRBooking)}
        onClose={() => setSelectedQRBooking(null)}
      />
    </div>
  );
}
