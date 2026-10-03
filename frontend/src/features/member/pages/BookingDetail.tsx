import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  QrCode,
  RefreshCw,
  XCircle,
  Receipt,
  Download,
  CalendarPlus,
  ShieldCheck,
  CheckCircle2,
  Tag,
  AlertTriangle,
  FileText,
  CreditCard,
  Building2,
  Sparkles,
} from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Money } from "@/components/shared/Money";
import { StatusTimeline } from "@/components/shared/StatusTimeline";
import { RescheduleModal } from "@/features/member/components/RescheduleModal";
import { CancelBookingDialog } from "@/features/member/components/CancelBookingDialog";
import { downloadCalendarEvent } from "@/lib/calendar";
import { useMemberBookings } from "@/features/booking/bookingStore";
import { SPORT_LABELS, SPORT_ICONS, type Booking } from "@/features/booking/types";
import type { PageProps } from "@/types/common";
import { QRCodeSVG } from "qrcode.react";

export default function BookingDetail({ params }: { params?: Record<string, string> | undefined }) {
  const { bookings, cancelBooking } = useMemberBookings();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  // Extract booking ID from route params or URL path
  const bookingId =
    params?.["id"] ??
    (typeof window !== "undefined"
      ? window.location.pathname.split("/").pop() ?? ""
      : "");

  const booking = bookings.find((b) => b.id.toLowerCase() === bookingId.toLowerCase());

  // Simulate brief loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [bookingId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 animate-pulse">
        <Skeleton className="h-8 w-48 bg-chalk/10 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 h-96 bg-chalk/10 rounded-3xl" />
          <Skeleton className="lg:col-span-5 h-96 bg-chalk/10 rounded-3xl" />
          <Skeleton className="lg:col-span-3 h-96 bg-chalk/10 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <EmptyState
          title="Booking Not Found"
          description={`We could not find any court reservation matching "${bookingId}". It may have expired or been removed.`}
          action={
            <AppLink to="/app/bookings">
              <Button variant="primary" leftIcon={<ArrowLeft className="size-4" />}>
                Back to My Bookings
              </Button>
            </AppLink>
          }
        />
      </div>
    );
  }

  const isUpcoming = booking.status === "CONFIRMED" || booking.status === "PENDING";
  const isCancelled = booking.status === "CANCELLED";

  const handleConfirmCancel = (id: string, reason: string) => {
    const res = cancelBooking(id, reason);
    if (res.success && res.result) {
      if (res.result.freeCancellation) {
        toast.success(
          "Booking Cancelled",
          `Full refund of ₹${res.result.refundAmount} recorded against original payment (BKG-14).`
        );
      } else {
        toast.warning(
          "Late Cancellation Fee Applied",
          `50% fee ₹${res.result.cancellationFee} applied. Refund of ₹${res.result.refundAmount} credited.`
        );
      }
    }
  };

  const handleRescheduleSuccess = (updated: any) => {
    toast.success(
      "Reschedule Confirmed",
      `Atomic move complete: ${updated.courtName} on ${updated.date} (${updated.startTime}–${updated.endTime}).`
    );
  };

  const handleDownloadReceipt = () => {
    toast.success("Receipt Generated", `Receipt #${booking.id}-REC downloaded for tax and claim records.`);
  };

  const handleAddToCalendar = () => {
    downloadCalendarEvent(booking);
    toast.info("Calendar Exported", `Downloaded .ics event for ${booking.courtName}.`);
  };

  const formattedDate = (() => {
    try {
      const [y, m, d] = booking.date.split("-").map(Number);
      if (!y || !m || !d) return booking.date;
      return new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(y, m - 1, d));
    } catch {
      return booking.date;
    }
  })();

  const qrValue = JSON.stringify({
    bookingId: booking.id,
    court: booking.courtName,
    date: booking.date,
    time: `${booking.startTime}-${booking.endTime}`,
    memberId: booking.memberId,
    code: booking.checkinCode ?? `CC-${booking.id}`,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div className="flex items-center gap-3">
          <AppLink
            to="/app/bookings"
            className="flex size-10 items-center justify-center rounded-2xl border border-chalk/14 bg-court-600 text-chalk hover:bg-court-700 hover:text-volt-400 transition-colors"
          >
            <ArrowLeft className="size-5" />
          </AppLink>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-chalk">
                {booking.courtName}
              </span>
              <span className="text-xl">{SPORT_ICONS[booking.sport]}</span>
              <StatusPill
                tone={
                  booking.status === "CONFIRMED"
                    ? "volt"
                    : booking.status === "COMPLETED"
                    ? "success"
                    : booking.status === "CANCELLED"
                    ? "danger"
                    : "warning"
                }
              >
                {booking.status.replace("_", " ")}
              </StatusPill>
            </div>
            <p className="text-xs text-chalk/70 mt-1 font-mono">
              Booking Ref: #{booking.id} · Created {new Date(booking.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {isUpcoming && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRescheduleOpen(true)}
                leftIcon={<RefreshCw className="size-3.5" />}
              >
                Reschedule
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={() => setCancelOpen(true)}
                leftIcon={<XCircle className="size-3.5" />}
              >
                Cancel Booking
              </Button>
            </>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddToCalendar}
            leftIcon={<CalendarPlus className="size-3.5" />}
          >
            Add to Calendar
          </Button>
        </div>
      </div>

      {/* Plan-change repricing banner (BKG-16) */}
      {booking.isRepriced && (
        <div className="flex items-center justify-between rounded-2xl bg-volt-400/12 border border-volt-400/30 p-4 text-xs text-volt-400 shadow-sm">
          <div className="flex items-center gap-2.5 font-medium">
            <Tag className="size-4 shrink-0" />
            <div>
              <span className="font-semibold block text-sm">Re-priced at new rate</span>
              <span className="text-chalk/80">
                {booking.repricedReason ?? "Membership tier adjusted; unpaid bookings reflect current rate."}
              </span>
            </div>
          </div>
          <span className="rounded-md bg-volt-400/20 px-2.5 py-1 text-[11px] font-mono text-volt-400">
            Unpaid Slot Repriced
          </span>
        </div>
      )}

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: StatusTimeline */}
        <div className="lg:col-span-4 space-y-6">
          <StatusTimeline
            currentStatus={booking.status}
            timeline={booking.timeline}
          />

          {/* Cancellation summary card if cancelled */}
          {isCancelled && (
            <div className="rounded-[20px] border border-danger/30 bg-danger/10 p-5 space-y-3 text-xs text-chalk">
              <div className="flex items-center gap-2 text-danger font-semibold">
                <AlertTriangle className="size-4" />
                <span>Cancellation Audit Record</span>
              </div>
              <p className="text-chalk/80 leading-relaxed">
                Reason: <span className="font-medium text-chalk">{booking.cancelReason ?? "Member initiated"}</span>
              </p>
              <div className="border-t border-danger/20 pt-2 flex justify-between">
                <span className="text-chalk/70">Refund processed:</span>
                <span className="font-semibold text-success">
                  <Money amount={booking.refundAmount ?? 0} />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-chalk/70">Fee deducted:</span>
                <span className="font-semibold text-danger">
                  <Money amount={booking.cancellationFee ?? 0} />
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CENTRE COLUMN: Booking info + Price Snapshot (Frozen) + Receipt */}
        <div className="lg:col-span-5 space-y-6">
          {/* Reservation Details */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
              Session Overview
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-chalk/60 flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-volt-400" />
                  Date
                </span>
                <p className="font-semibold text-chalk text-sm">{formattedDate}</p>
              </div>

              <div className="space-y-1">
                <span className="text-chalk/60 flex items-center gap-1.5">
                  <Clock className="size-3.5 text-volt-400" />
                  Time Window
                </span>
                <p className="font-semibold text-chalk text-sm">
                  {booking.startTime} – {booking.endTime} (60 min)
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-chalk/60 flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-volt-400" />
                  Sport & Facility
                </span>
                <p className="font-medium text-chalk">
                  {SPORT_LABELS[booking.sport]} · Court #{booking.courtId.toUpperCase()}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-chalk/60 flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-volt-400" />
                  Location
                </span>
                <p className="font-medium text-chalk">Main Arena (Courtside Ground)</p>
              </div>
            </div>
          </div>

          {/* Frozen Price Snapshot (BKG-13: Frozen price + discount source, never recalculated) */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-chalk/10 pb-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-chalk">
                  Price Snapshot (Frozen)
                </h3>
                <p className="text-[11px] text-chalk/60">
                  Rate locked at booking time; unaffected by subsequent tariff changes
                </p>
              </div>
              <ShieldCheck className="size-5 text-volt-400 shrink-0" />
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-chalk/70">
                <span>Standard Guest Rate:</span>
                <span className="font-mono text-chalk">
                  <Money amount={booking.guestRate ?? booking.price * 2} />
                </span>
              </div>

              <div className="flex justify-between text-volt-400">
                <span>
                  {booking.planName ?? "Member"} Tier Discount (#{booking.ruleId ?? "R-STD"}):
                </span>
                <span className="font-mono font-medium">
                  - <Money amount={booking.planDiscount ?? (booking.guestRate ? booking.guestRate - booking.price : 0)} />
                </span>
              </div>

              <div className="border-t border-chalk/10 pt-2.5 flex items-center justify-between text-sm font-semibold">
                <span className="text-chalk">Total Charged / Locked:</span>
                <span className="text-volt-400 text-base">
                  {booking.price === 0 ? "Complimentary (₹0)" : <Money amount={booking.price} />}
                </span>
              </div>

              <div className="rounded-xl bg-court-600/70 p-3 border border-chalk/8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-chalk/60" />
                  <span className="text-xs text-chalk/80">
                    Payment Method: <span className="font-medium text-chalk">{booking.paymentMethod ?? "UPI / Online"}</span>
                  </span>
                </div>
                <span className="rounded-md bg-success/20 px-2 py-0.5 text-[10px] font-mono text-success font-semibold">
                  {booking.paymentStatus ?? "CONFIRMED"}
                </span>
              </div>
            </div>

            {/* Payment Receipt Link */}
            <div className="pt-2 border-t border-chalk/10 flex items-center justify-between">
              <span className="text-xs text-chalk/60">Official Tax Invoice & Receipt</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadReceipt}
                leftIcon={<Download className="size-3.5" />}
                className="text-xs h-8 text-volt-400 hover:text-volt-300"
              >
                Download Receipt (.PDF)
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Actions + Large QR for Desk Check-in */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-[20px] border border-chalk/14 bg-court-500 p-6 flex flex-col items-center text-center space-y-4">
            <div className="flex items-center gap-2 text-volt-400 text-xs font-semibold uppercase tracking-wider">
              <QrCode className="size-4" />
              <span>Desk Check-In QR</span>
            </div>

            {/* High-contrast white QR container */}
            <div className="rounded-2xl bg-white p-4 shadow-xl ring-4 ring-volt-400/20">
              <QRCodeSVG
                value={qrValue}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="w-full rounded-xl bg-court-600/80 p-2.5 border border-chalk/10">
              <span className="text-[10px] uppercase tracking-widest text-chalk/50 block">Fast PIN</span>
              <span className="text-base font-mono font-bold tracking-widest text-volt-400">
                {booking.checkinCode ?? `CC-${booking.id}`}
              </span>
            </div>

            <p className="text-[11px] text-chalk/60 leading-relaxed">
              Show this QR code at the front desk tablet or scanner for turnstile access.
            </p>
          </div>

          {/* Quick Help / Policies */}
          <div className="rounded-[20px] border border-chalk/14 bg-court-600/40 p-5 space-y-2 text-xs text-chalk/70">
            <div className="flex items-center gap-1.5 font-medium text-chalk">
              <Sparkles className="size-3.5 text-volt-400" />
              <span>Champions Club Rules</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-chalk/60">
              <li>Free cancellation up to 4 hours prior.</li>
              <li>Late cancellation incurs a 50% fee.</li>
              <li>Non-marking sports shoes mandatory on all indoor courts.</li>
              <li>Grace period: 15 minutes before slot is marked no-show.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      <RescheduleModal
        booking={booking}
        isOpen={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Cancel Modal */}
      <CancelBookingDialog
        booking={booking}
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
