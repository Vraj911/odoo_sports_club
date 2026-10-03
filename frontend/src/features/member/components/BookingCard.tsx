import { useState } from "react";
import { QrCode, RefreshCw, XCircle, CalendarPlus, ChevronRight, Tag, AlertCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { Money } from "@/components/shared/Money";
import { AppLink } from "@/app/router/links";
import type { Booking, Sport } from "@/features/booking/types";
import { SPORT_ICONS } from "@/features/booking/types";
import { cn } from "@/lib/cn";

export interface BookingCardProps {
  booking: Booking;
  onOpenQR: (booking: Booking) => void;
  onOpenReschedule: (booking: Booking) => void;
  onOpenCancel: (booking: Booking) => void;
  onAddToCalendar: (booking: Booking) => void;
}

export function BookingCard({
  booking,
  onOpenQR,
  onOpenReschedule,
  onOpenCancel,
  onAddToCalendar,
}: BookingCardProps) {
  const isUpcoming = booking.status === "CONFIRMED" || booking.status === "PENDING";
  const isCancelled = booking.status === "CANCELLED";
  const isPast = booking.status === "COMPLETED" || booking.status === "NO_SHOW";
  const isWaitlisted = booking.status === "WAITLISTED";

  // Format date like "Thu 8 Oct"
  const formattedDate = (() => {
    try {
      const [y, m, d] = booking.date.split("-").map(Number);
      if (!y || !m || !d) return booking.date;
      const dateObj = new Date(y, m - 1, d);
      return new Intl.DateTimeFormat("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
      }).format(dateObj);
    } catch {
      return booking.date;
    }
  })();

  const getStatusVariant = () => {
    switch (booking.status) {
      case "CONFIRMED":
        return "volt" as const;
      case "COMPLETED":
        return "success" as const;
      case "CHECKED_IN":
        return "info" as const;
      case "CANCELLED":
        return "danger" as const;
      case "NO_SHOW":
        return "warning" as const;
      case "WAITLISTED":
        return "warning" as const;
      default:
        return "neutral" as const;
    }
  };

  return (
    <div className="group relative flex flex-col justify-between rounded-[20px] border border-chalk/14 bg-court-500 p-5 sm:p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-chalk/28 hover:shadow-card">
      {/* Plan-change repricing banner (BKG-16) */}
      {booking.isRepriced && (
        <div className="mb-3.5 flex items-center justify-between rounded-xl bg-volt-400/12 border border-volt-400/30 px-3 py-1.5 text-xs text-volt-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Tag className="size-3.5" />
            <span>Re-priced at new rate</span>
          </div>
          <span className="text-[11px] text-chalk/60 hidden sm:inline">
            {booking.repricedReason ?? "Plan tier adjusted"}
          </span>
        </div>
      )}

      {/* Top row: Sport icon + title + Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Sport Icon Badge */}
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-court-600 border border-chalk/14 text-xl shadow-inner group-hover:border-volt-400/30 transition-colors">
            {SPORT_ICONS[booking.sport]}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <AppLink
                to={`/app/bookings/${booking.id}`}
                className="text-base font-semibold text-chalk hover:text-volt-400 transition-colors flex items-center gap-1.5"
              >
                <span>{booking.courtName}</span>
                <ChevronRight className="size-4 text-chalk/40 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </AppLink>

              {isWaitlisted && (
                <Badge variant="warning" className="h-5 text-[11px] px-2">
                  Waitlist #{booking.waitlistPosition ?? 1}
                </Badge>
              )}
            </div>

            <p className="text-xs text-chalk/70 mt-0.5 flex items-center gap-1.5 font-mono">
              <span>{formattedDate}</span>
              <span>·</span>
              <span className="text-chalk font-semibold">{booking.startTime}–{booking.endTime}</span>
            </p>
          </div>
        </div>

        {/* Status Pill */}
        <div className="self-start sm:self-center">
          <StatusPill tone={getStatusVariant()}>
            {booking.status.replace("_", " ")}
          </StatusPill>
        </div>
      </div>

      {/* Middle row: Frozen price + rule + details */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-chalk/10 pt-3 text-xs text-chalk/70">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-volt-400">
            {booking.price === 0 ? "Complimentary" : <Money amount={booking.price} />}
          </span>
          <span>·</span>
          <span className="font-mono text-chalk/60">
            {booking.planName ?? "Member"} rule #{booking.ruleId ?? "R-STD"}
          </span>
          {booking.paymentStatus && (
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase font-mono",
                booking.paymentStatus === "PAID" && "bg-success/15 text-success",
                booking.paymentStatus === "UNPAID" && "bg-warning/15 text-warning",
                booking.paymentStatus === "REFUNDED" && "bg-info/15 text-info",
                booking.paymentStatus === "PARTIAL_REFUND" && "bg-info/15 text-info"
              )}
            >
              {booking.paymentStatus.replace("_", " ")}
            </span>
          )}
        </div>

        {/* Cancellation or Refund summary note if cancelled */}
        {isCancelled && booking.refundAmount !== undefined && (
          <span className="text-[11px] text-chalk/50 font-mono">
            Refund: ₹{booking.refundAmount} (Fee: ₹{booking.cancellationFee ?? 0})
          </span>
        )}
      </div>

      {/* Bottom row: Actions */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-chalk/8">
        <AppLink
          to={`/app/bookings/${booking.id}`}
          className="text-xs text-chalk/60 hover:text-chalk underline-offset-4 hover:underline"
        >
          View receipt & details
        </AppLink>

        <div className="flex items-center gap-1.5">
          {/* QR Button (only for upcoming or checked in) */}
          {(isUpcoming || booking.status === "CHECKED_IN") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenQR(booking)}
              leftIcon={<QrCode className="size-3.5" />}
              className="text-xs h-8 px-3"
            >
              QR
            </Button>
          )}

          {/* Reschedule Button (only for upcoming) */}
          {isUpcoming && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenReschedule(booking)}
              leftIcon={<RefreshCw className="size-3.5" />}
              className="text-xs h-8 px-3"
            >
              Reschedule
            </Button>
          )}

          {/* Cancel Button (only for upcoming) */}
          {isUpcoming && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onOpenCancel(booking)}
              leftIcon={<XCircle className="size-3.5" />}
              className="text-xs h-8 px-3"
            >
              Cancel
            </Button>
          )}

          {/* Add to Calendar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddToCalendar(booking)}
            leftIcon={<CalendarPlus className="size-3.5" />}
            title="Add to calendar (.ics)"
            className="text-xs h-8 px-2.5"
          >
            Calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
