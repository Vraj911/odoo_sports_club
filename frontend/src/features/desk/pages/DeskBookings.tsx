import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import {
  ListChecks,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  DollarSign,
  AlertTriangle,
  XCircle,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { Drawer } from "@/components/ui/Drawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { SAMPLE_DESK_BOOKINGS, performDeskCheckin } from "../sampleData";
import type { DeskBookingRecord } from "../types";
import type { Sport } from "@/features/booking/types";

export default function DeskBookings() {
  const navigate = useGo();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sportFilter, setSportFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

  // Selected booking for Drawer
  const [selectedBooking, setSelectedBooking] = useState<DeskBookingRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Cancellation ReasonDialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtered dataset
  const filteredBookings = useMemo(() => {
    return SAMPLE_DESK_BOOKINGS.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (sportFilter !== "ALL" && b.sport !== sportFilter) return false;
      if (sourceFilter !== "ALL" && b.source !== sourceFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.memberName.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchCourt = b.courtName.toLowerCase().includes(q);
        const matchMemId = b.memberId.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCourt && !matchMemId) return false;
      }
      return true;
    });
  }, [searchQuery, statusFilter, sportFilter, sourceFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "Booking ID",
      "Member Name",
      "Member ID",
      "Court",
      "Sport",
      "Date",
      "Start Time",
      "End Time",
      "Price",
      "Status",
      "Source",
      "Payment Method",
    ];

    const rows = filteredBookings.map((b) => [
      b.id,
      `"${b.memberName}"`,
      b.memberId,
      `"${b.courtName}"`,
      b.sport,
      b.date,
      b.startTime,
      b.endTime,
      b.price,
      b.status,
      b.source,
      b.paymentMethod,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CCMS_Bookings_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRowClick = (bkg: DeskBookingRecord) => {
    setSelectedBooking(bkg);
    setIsDrawerOpen(true);
  };

  const handleCheckin = () => {
    if (!selectedBooking) return;
    performDeskCheckin(selectedBooking.memberId);
    selectedBooking.status = "CHECKED_IN";
    selectedBooking.checkedInAt = Date.now();
    setToastMessage(`Checked in ${selectedBooking.memberName}!`);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelBooking = (reason: string) => {
    if (!selectedBooking) return;
    selectedBooking.status = "CANCELLED";
    selectedBooking.cancelledAt = Date.now();
    selectedBooking.cancelReason = reason;
    setToastMessage(`Booking #${selectedBooking.id} cancelled. Reason: ${reason}`);
    setIsCancelOpen(false);
    setIsDrawerOpen(false);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const columns: Column<DeskBookingRecord>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (b) => (
        <button
          type="button"
          onClick={() => handleRowClick(b)}
          className="font-mono text-xs text-volt-400 hover:underline font-semibold"
        >
          {b.id}
        </button>
      ),
    },
    {
      key: "member",
      header: "Member / Guest",
      render: (b) => (
        <div className="cursor-pointer" onClick={() => handleRowClick(b)}>
          <p className="font-semibold text-white">{b.memberName}</p>
          <p className="text-[11px] text-white/50 font-mono">{b.memberId} · {b.tier}</p>
        </div>
      ),
    },
    {
      key: "court",
      header: "Court & Sport",
      render: (b) => (
        <div>
          <p className="text-white font-medium">{b.courtName}</p>
          <p className="text-[11px] text-volt-400 uppercase font-mono">{b.sport}</p>
        </div>
      ),
    },
    {
      key: "schedule",
      header: "Date & Time",
      render: (b) => (
        <div>
          <p className="text-white text-xs">{b.date}</p>
          <p className="text-[11px] text-white/60 font-mono">
            {b.startTime} – {b.endTime}
          </p>
        </div>
      ),
    },
    {
      key: "price",
      header: "Amount",
      render: (b) => (
        <span className="font-mono font-semibold text-white">
          ₹{b.price.toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "source",
      header: "Source",
      render: (b) => (
        <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-white/70 uppercase border border-white/10 font-mono">
          {b.source}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <StatusPill
          variant={
            b.status === "CONFIRMED"
              ? "info"
              : b.status === "CHECKED_IN"
              ? "success"
              : b.status === "NO_SHOW"
              ? "warning"
              : "danger"
          }
        >
          {b.status}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 rounded-pill bg-navy-800 border-l-4 border-volt-400 px-5 py-3 shadow-2xl text-sm font-medium text-white flex items-center gap-3 animate-slide-in">
          <CheckCircle2 className="size-4 text-volt-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ListChecks className="size-6 text-volt-400" />
            <span>Master Bookings Register</span>
          </h1>
          <p className="text-xs text-white/60 mt-0.5">
            Filter, inspect detail drawers, check-in, or export audit logs to CSV
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleExportCSV}
            className="flex items-center gap-2 text-xs"
          >
            <Download className="size-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => navigate("/desk/walk-in")}
            className="flex items-center gap-2 text-xs"
          >
            <Plus className="size-3.5" />
            <span>New Walk-in</span>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-court-600/70 border-white/10 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by member, booking ID, or court..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="size-4 text-white/40" />}
          />
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Statuses</option>
          <option value="CONFIRMED" className="bg-navy-900 text-white">Confirmed</option>
          <option value="CHECKED_IN" className="bg-navy-900 text-white">Checked In</option>
          <option value="COMPLETED" className="bg-navy-900 text-white">Completed</option>
          <option value="CANCELLED" className="bg-navy-900 text-white">Cancelled</option>
          <option value="NO_SHOW" className="bg-navy-900 text-white">No-Show</option>
        </select>

        {/* Sport Dropdown */}
        <select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Sports</option>
          <option value="tennis" className="bg-navy-900 text-white">Tennis</option>
          <option value="padel" className="bg-navy-900 text-white">Padel</option>
          <option value="badminton" className="bg-navy-900 text-white">Badminton</option>
          <option value="squash" className="bg-navy-900 text-white">Squash</option>
          <option value="cricket" className="bg-navy-900 text-white">Cricket</option>
          <option value="pickleball" className="bg-navy-900 text-white">Pickleball</option>
        </select>

        {/* Source Dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="h-12 rounded-xl bg-white/8 border border-white/15 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
        >
          <option value="ALL" className="bg-navy-900 text-white">All Sources</option>
          <option value="online" className="bg-navy-900 text-white">Online App</option>
          <option value="walk-in" className="bg-navy-900 text-white">Walk-in</option>
          <option value="phone" className="bg-navy-900 text-white">Phone</option>
        </select>
      </Card>

      {/* Bookings DataTable */}
      <Table
        columns={columns}
        data={filteredBookings}
        keyExtractor={(b) => b.id}
        emptyTitle="No bookings found"
        emptySubtitle="Try adjusting the search query or status filter."
      />

      {/* Booking Detail Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <span>Booking #{selectedBooking?.id}</span>
            {selectedBooking && (
              <StatusPill
                variant={
                  selectedBooking.status === "CONFIRMED"
                    ? "info"
                    : selectedBooking.status === "CHECKED_IN"
                    ? "success"
                    : selectedBooking.status === "NO_SHOW"
                    ? "warning"
                    : "danger"
                }
              >
                {selectedBooking.status}
              </StatusPill>
            )}
          </div>
        }
        subtitle="Reservation breakdown, check-in, and audit trail"
      >
        {selectedBooking && (
          <div className="flex flex-col gap-5">
            {/* Customer Box */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white text-base">
                  {selectedBooking.memberName}
                </h4>
                <p className="text-xs text-white/60 font-mono">
                  {selectedBooking.memberId} · {selectedBooking.tier}
                </p>
              </div>
              {selectedBooking.memberId.startsWith("CC-") && (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-xs text-volt-400 hover:text-volt-300"
                  onClick={() => navigate(`/desk/members/${selectedBooking.memberId}`)}
                >
                  View Profile
                </Button>
              )}
            </div>

            {/* Session Info */}
            <div className="p-4 rounded-2xl bg-navy-950/60 border border-white/10 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-white/60">Court &amp; Sport:</span>
                <span className="font-semibold text-white">
                  {selectedBooking.courtName} ({selectedBooking.sport.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Date:</span>
                <span className="font-mono text-white">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Time Slot:</span>
                <span className="font-mono text-volt-400 font-semibold">
                  {selectedBooking.startTime} – {selectedBooking.endTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Booking Source:</span>
                <span className="uppercase text-white">{selectedBooking.source}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2">
                <span className="text-white/60">Total Fee Paid:</span>
                <span className="font-mono font-bold text-volt-400">
                  ₹{selectedBooking.price.toLocaleString("en-IN")} via {selectedBooking.paymentMethod}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {selectedBooking.status === "CONFIRMED" && (
                <Button
                  type="button"
                  variant="primary"
                  className="w-full h-12 font-bold"
                  onClick={handleCheckin}
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Check-in Member
                </Button>
              )}

              {selectedBooking.status !== "CANCELLED" && (
                <Button
                  type="button"
                  variant="danger"
                  className="w-full text-xs"
                  onClick={() => setIsCancelOpen(true)}
                >
                  <XCircle className="size-3.5 mr-1.5" />
                  Cancel Booking (Audited)
                </Button>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Cancellation ReasonDialog */}
      <ReasonDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelBooking}
        title="Cancel Court Reservation"
        description="Cancellation releases the slot back to general availability and initiates account refund/credit if applicable."
        actionLabel="Confirm Cancellation"
        variant="danger"
      />
    </div>
  );
}
