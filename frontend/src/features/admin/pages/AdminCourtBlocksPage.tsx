import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { useAdminOpsStore } from "../adminOpsStore";
import type { CourtBlockRecord, AdminResourceBooking } from "../types";
import {
  Ban,
  Plus,
  AlertTriangle,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Layers,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "@/components/ui/Toast";

const TIME_OPTIONS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
  "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

export default function AdminCourtBlocksPage() {
  const { courts, blocks, bookings, createCourtBlock, unblockCourt } = useAdminOpsStore();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCourtId, setSelectedCourtId] = useState(courts[0]?.id || "CRT-T1");
  const [blockDate, setBlockDate] = useState("2026-10-06");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("14:00");
  const [reason, setReason] = useState<CourtBlockRecord["reason"]>("MAINTENANCE");
  const [notes, setNotes] = useState("");

  // Affected bookings detection
  const affectedBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.courtId === selectedCourtId &&
        b.date === blockDate &&
        b.status !== "CANCELLED" &&
        b.startTime >= startTime &&
        b.startTime < endTime
    );
  }, [bookings, selectedCourtId, blockDate, startTime, endTime]);

  // Bulk cancel confirmation dialog
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  const handleSubmitBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (startTime >= endTime) {
      toast.error("Start time must precede end time.");
      return;
    }

    if (affectedBookings.length > 0) {
      // Must prompt ReasonDialog for bulk cancellation of affected member bookings
      setIsCancelConfirmOpen(true);
    } else {
      createCourtBlock({
        courtId: selectedCourtId,
        date: blockDate,
        startTime,
        endTime,
        reason,
        notes: notes.trim() || `${reason} Block`,
        cancelAffectedBookings: false,
      });
      setIsCreateModalOpen(false);
      setNotes("");
    }
  };

  const handleConfirmBulkCancel = (cancellationReason: string) => {
    createCourtBlock({
      courtId: selectedCourtId,
      date: blockDate,
      startTime,
      endTime,
      reason,
      notes: notes.trim() || `${reason} Block`,
      cancelAffectedBookings: true,
      cancellationReason,
    });

    setIsCancelConfirmOpen(false);
    setIsCreateModalOpen(false);
    setNotes("");
  };

  const columns: Column<CourtBlockRecord>[] = [
    {
      key: "court",
      header: "Blocked Court & Reason",
      render: (blk) => (
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-chalk">{blk.courtName}</p>
          <div className="flex items-center gap-1.5">
            <span className="rounded px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              {blk.reason}
            </span>
            <span className="text-[11px] text-chalk/50 font-mono uppercase">{blk.sport}</span>
          </div>
          {blk.notes && <p className="text-[10px] text-chalk/60 italic">{blk.notes}</p>}
        </div>
      ),
    },
    {
      key: "window",
      header: "Schedule Window",
      render: (blk) => (
        <div className="font-mono text-xs space-y-0.5">
          <p className="text-chalk font-semibold">{blk.date}</p>
          <p className="text-volt-400 font-bold">{blk.startTime} – {blk.endTime} IST</p>
        </div>
      ),
    },
    {
      key: "affected",
      header: "Impacted Bookings",
      render: (blk) => (
        <span className="font-mono text-xs text-chalk/80">
          {blk.affectedBookingIds.length > 0 ? (
            <span className="text-rose-400 font-bold">
              {blk.affectedBookingIds.length} cancelled & refunded
            </span>
          ) : (
            <span className="text-chalk/40">0 conflicts</span>
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Block Status",
      render: (blk) => (
        <StatusPill variant={blk.status === "ACTIVE" ? "warning" : "neutral"}>
          {blk.status}
        </StatusPill>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (blk) => (
        <div>
          {blk.status === "ACTIVE" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => unblockCourt(blk.id)}
              className="text-xs text-volt-400 hover:text-volt-300"
            >
              Lift Block
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Court Maintenance & Event Blocks"
        subtitle="Manage court closure windows, maintenance schedules, tournament overrides, and automated refund notifications (BR-03)."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 text-xs font-bold"
          >
            <Plus className="size-4" /> Block Court Slot
          </Button>
        }
      />

      {/* Blocks Directory Table */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ban className="size-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-chalk">Active & Scheduled Court Blocks</h3>
          </div>
          <span className="text-xs text-chalk/50 font-mono">
            {blocks.length} recorded blocks
          </span>
        </div>

        <Table
          data={blocks}
          columns={columns}
          keyExtractor={(b) => b.id}
          emptyTitle="No court blocks found"
          emptySubtitle="All courts are currently open and available according to regular operating hours."
        />
      </Card>

      {/* Create Court Block Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
              <Ban className="size-4" />
            </div>
            <span>Block Court Resource (BR-03)</span>
          </div>
        }
      >
        <form onSubmit={handleSubmitBlock} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Select Court</label>
            <select
              value={selectedCourtId}
              onChange={(e) => setSelectedCourtId(e.target.value)}
              className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              required
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id} className="bg-navy-900 text-chalk">
                  {c.name} ({c.sport})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-chalk/80">Date</label>
              <Input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-chalk/80">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-navy-900 text-chalk">{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-chalk/80">End Time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t} value={t} className="bg-navy-900 text-chalk">{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Block Reason Category</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as any)}
              className="w-full h-12 rounded-xl bg-white/8 border border-white/18 text-chalk px-3 text-xs focus:border-volt-400 focus:outline-none"
            >
              <option value="MAINTENANCE" className="bg-navy-900 text-chalk">Routine / Urgent Maintenance</option>
              <option value="TOURNAMENT" className="bg-navy-900 text-chalk">Official Tournament Fixture</option>
              <option value="WEATHER" className="bg-navy-900 text-chalk">Weather / Rain Precaution</option>
              <option value="VIP_EVENT" className="bg-navy-900 text-chalk">Exclusive Club / VIP Event</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-chalk/80">Operational Notes & Justification</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Surface resurfacing and net tension calibration"
              required
            />
          </div>

          {/* Live Affected Bookings Preview */}
          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-chalk flex items-center gap-1.5">
                <Users className="size-3.5 text-volt-400" /> Overlapping Member Bookings:
              </span>
              <span className={cn("font-mono font-bold", affectedBookings.length > 0 ? "text-amber-400" : "text-emerald-400")}>
                {affectedBookings.length} Bookings Detected
              </span>
            </div>

            {affectedBookings.length > 0 ? (
              <div className="space-y-1 pt-1">
                {affectedBookings.map((b) => (
                  <div key={b.id} className="flex justify-between text-[11px] font-mono text-chalk/80 py-0.5 border-b border-chalk/5">
                    <span>{b.memberName} ({b.memberTier})</span>
                    <span className="text-volt-400">{b.startTime}–{b.endTime}</span>
                  </div>
                ))}
                <p className="text-[10px] text-amber-300 pt-1">
                  ⚠ Submitting this block will require a mandatory cancellation justification and will trigger full refund credit.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-chalk/60">
                No active reservations collide with this requested timeframe. Safe to block immediately.
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-chalk/10">
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={affectedBookings.length > 0 ? "danger" : "primary"}
              size="sm"
            >
              {affectedBookings.length > 0 ? "Proceed with Cancellation" : "Apply Court Block"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mandatory Reason Dialog for Bulk Cancel & Refund */}
      <ReasonDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleConfirmBulkCancel}
        title="Confirm Court Block & Bulk Cancellation"
        description={`This action will block ${courts.find((c) => c.id === selectedCourtId)?.name} and immediately cancel and fully refund ${affectedBookings.length} overlapping booking(s). A mandatory audit justification is required.`}
        actionLabel="Cancel Bookings & Apply Block"
        variant="danger"
      />
    </div>
  );
}
