import { useState, useMemo, useEffect } from "react";
import {
  CalendarDays,
  Filter,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { AppLink } from "@/app/router/links";
import type { Booking, Sport } from "@/features/booking/types";
import { SPORT_LABELS } from "@/features/booking/types";
import { useMemberBookings } from "@/features/booking/bookingStore";
import { BookingCard } from "@/features/member/components/BookingCard";
import { CancelBookingDialog } from "@/features/member/components/CancelBookingDialog";
import { RescheduleModal } from "@/features/member/components/RescheduleModal";
import { BookingQRModal } from "@/features/member/components/BookingQRModal";
import { downloadCalendarEvent } from "@/lib/calendar";

type BookingTab = "upcoming" | "past" | "cancelled" | "waitlist";

export default function MyBookings() {
  const { bookings, cancelBooking } = useMemberBookings();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<BookingTab>("upcoming");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Dialog targets
  const [qrBooking, setQrBooking] = useState<Booking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Booking | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);

  // Simulated initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filtered lists for each tab
  const categorized = useMemo(() => {
    const upcoming: Booking[] = [];
    const past: Booking[] = [];
    const cancelled: Booking[] = [];
    const waitlist: Booking[] = [];

    bookings.forEach((b) => {
      if (b.status === "CANCELLED") {
        cancelled.push(b);
      } else if (b.status === "WAITLISTED") {
        waitlist.push(b);
      } else if (b.status === "COMPLETED" || b.status === "NO_SHOW") {
        past.push(b);
      } else {
        // CONFIRMED, PENDING, CHECKED_IN
        upcoming.push(b);
      }
    });

    return { upcoming, past, cancelled, waitlist };
  }, [bookings]);

  // Tab definitions with counts
  const tabs: TabItem[] = [
    {
      id: "upcoming",
      label: "Upcoming",
      badge: categorized.upcoming.length > 0 ? (
        <span className="ml-1 rounded-pill bg-volt-400/20 px-2 py-0.5 text-[11px] font-semibold text-volt-400">
          {categorized.upcoming.length}
        </span>
      ) : undefined,
    },
    {
      id: "past",
      label: "Past",
      badge: categorized.past.length > 0 ? (
        <span className="ml-1 rounded-pill bg-chalk/10 px-2 py-0.5 text-[11px] text-chalk/70">
          {categorized.past.length}
        </span>
      ) : undefined,
    },
    {
      id: "cancelled",
      label: "Cancelled",
      badge: categorized.cancelled.length > 0 ? (
        <span className="ml-1 rounded-pill bg-danger/20 px-2 py-0.5 text-[11px] text-danger">
          {categorized.cancelled.length}
        </span>
      ) : undefined,
    },
    {
      id: "waitlist",
      label: "Waitlist",
      badge: categorized.waitlist.length > 0 ? (
        <span className="ml-1 rounded-pill bg-amber-400/20 px-2 py-0.5 text-[11px] text-amber-300">
          {categorized.waitlist.length}
        </span>
      ) : undefined,
    },
  ];

  // Active list after sport and search filter
  const currentList = useMemo(() => {
    let list = categorized[activeTab];

    if (sportFilter !== "all") {
      list = list.filter((b) => b.sport === sportFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.courtName.toLowerCase().includes(q) ||
          b.date.includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [categorized, activeTab, sportFilter, searchQuery]);

  // Action handlers
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
          `Within 4h window: 50% fee ₹${res.result.cancellationFee} applied. Refund ₹${res.result.refundAmount} credited.`
        );
      }
    }
  };

  const handleRescheduleSuccess = (updated: Booking) => {
    toast.success(
      "Reschedule Confirmed",
      `Atomic move complete: ${updated.courtName} on ${updated.date} (${updated.startTime}–${updated.endTime}).`
    );
  };

  const handleAddToCalendar = (booking: Booking) => {
    downloadCalendarEvent(booking);
    toast.info("Calendar Event Exported", `Downloaded .ics for #${booking.id} (${booking.courtName}).`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-chalk/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-chalk">My Bookings</h1>
            <Badge variant="volt" className="h-6">
              Active Member
            </Badge>
          </div>
          <p className="text-sm text-chalk/70 mt-1">
            Manage your court reservations, atomic rescheduling, check-in QR codes, and waitlists.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AppLink to="/app/book">
            <Button variant="primary" leftIcon={<Plus className="size-4" />}>
              Book a Court
            </Button>
          </AppLink>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tabs */}
        <Tabs
          tabs={tabs}
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as BookingTab)}
        />

        {/* Filters right */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sport Filter */}
          <div className="w-40 sm:w-44">
            <Select
              options={[
                { value: "all", label: "All Sports" },
                { value: "tennis", label: "Tennis" },
                { value: "padel", label: "Padel" },
                { value: "badminton", label: "Badminton" },
                { value: "cricket-net", label: "Cricket Net" },
              ]}
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="h-10 text-xs"
            />
          </div>

          {/* Search box */}
          <div className="w-48 sm:w-56">
            <Input
              placeholder="Filter by court/date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="size-4" />}
              className="h-10 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Error state simulation */}
      {hasError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 p-8 text-center text-chalk">
          <AlertCircle className="size-8 text-danger mx-auto mb-2" />
          <h3 className="text-base font-semibold">Unable to fetch bookings</h3>
          <p className="text-xs text-chalk/70 mt-1 max-w-sm mx-auto">
            A temporary connection issue occurred while syncing with the court scheduler.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setHasError(false)}
            leftIcon={<RefreshCw className="size-3.5" />}
            className="mt-4"
          >
            Retry Sync
          </Button>
        </div>
      ) : loading ? (
        /* Loading Skeleton */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-[20px] border border-chalk/10 bg-court-500/50 p-6 space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-11 rounded-2xl bg-chalk/10" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32 bg-chalk/10" />
                    <Skeleton className="h-3 w-24 bg-chalk/10" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-pill bg-chalk/10" />
              </div>
              <Skeleton className="h-8 w-full bg-chalk/10 rounded-xl" />
            </div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-chalk/14 bg-court-500/60 p-12 text-center">
          <EmptyState
            title={`No ${activeTab} bookings`}
            description={
              searchQuery || sportFilter !== "all"
                ? "Try clearing your filters to see more reservations."
                : activeTab === "upcoming"
                ? "You don't have any upcoming court sessions scheduled. Book a slot today!"
                : activeTab === "waitlist"
                ? "You are not currently waitlisted for any sessions."
                : `No bookings found under the ${activeTab} category.`
            }
            action={
              activeTab === "upcoming" ? (
                <AppLink to="/app/book">
                  <Button variant="primary" leftIcon={<Plus className="size-4" />}>
                    Book a Court Now
                  </Button>
                </AppLink>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSportFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear Filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        /* Booking Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {currentList.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onOpenQR={(b) => setQrBooking(b)}
              onOpenReschedule={(b) => setRescheduleTarget(b)}
              onOpenCancel={(b) => setCancelTarget(b)}
              onAddToCalendar={handleAddToCalendar}
            />
          ))}
        </div>
      )}

      {/* QR Code Modal */}
      <BookingQRModal
        booking={qrBooking}
        isOpen={Boolean(qrBooking)}
        onClose={() => setQrBooking(null)}
      />

      {/* Atomic Reschedule Modal with AvailabilityGrid */}
      <RescheduleModal
        booking={rescheduleTarget}
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Cancellation Dialog with policy breakdown */}
      <CancelBookingDialog
        booking={cancelTarget}
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
