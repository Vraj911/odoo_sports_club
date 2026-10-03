import { useState, useMemo } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { ClockWidget } from "../components/ClockWidget";
import type { AttendanceRecord } from "../types";
import {
  Fingerprint,
  Calendar,
  Clock,
  Search,
  CheckCircle2,
  AlertTriangle,
  History,
  Edit3,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function HrAttendancePage() {
  const go = useGo();
  const { attendance, employees, correctAttendance } = useHrStore();

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("2026-10-05");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  // Correction state
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceRecord | null>(null);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [newClockIn, setNewClockIn] = useState("");
  const [newClockOut, setNewClockOut] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      if (selectedStatus !== "ALL" && a.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          a.employeeName.toLowerCase().includes(q) ||
          a.employeeId.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [attendance, selectedStatus, search]);

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setCorrectingRecord(record);
    setNewClockIn(record.clockIn || "09:00");
    setNewClockOut(record.clockOut || "18:00");
    setCorrectionReason("");
    setReasonError("");
    setIsCorrectionModalOpen(true);
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setReasonError("Mandatory audit reason is required for attendance correction.");
      return;
    }
    if (!correctingRecord) return;

    correctAttendance(
      correctingRecord.id,
      newClockIn,
      newClockOut,
      correctionReason.trim(),
      "Sunita Deshmukh (Admin)"
    );

    setIsCorrectionModalOpen(false);
  };

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "employee",
      header: "Employee & Shift",
      render: (a) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-chalk text-xs">{a.employeeName}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {a.employeeId} · {a.department.replace("_", " ")}
          </p>
          <span className="text-[10px] text-chalk/70 font-mono block">{a.shift}</span>
        </div>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (a) => <span className="font-mono text-xs text-chalk/80">{a.date}</span>,
    },
    {
      key: "clockIn",
      header: "Clock In",
      render: (a) => (
        <div className="font-mono text-xs">
          {a.clockIn ? (
            <span className={cn("font-bold", a.status === "LATE" ? "text-amber-400" : "text-emerald-400")}>
              {a.clockIn}
            </span>
          ) : (
            <span className="text-chalk/40">—</span>
          )}
        </div>
      ),
    },
    {
      key: "clockOut",
      header: "Clock Out",
      render: (a) => (
        <div className="font-mono text-xs">
          {a.clockOut ? (
            <span className={cn("font-bold", a.status === "EARLY" ? "text-amber-400" : "text-emerald-400")}>
              {a.clockOut}
            </span>
          ) : (
            <span className="text-chalk/40">—</span>
          )}
        </div>
      ),
    },
    {
      key: "hours",
      header: "Total Hrs",
      render: (a) => (
        <span className="font-mono text-xs text-chalk/90 font-bold">
          {a.totalHours !== undefined ? `${a.totalHours}h` : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status Flag",
      render: (a) => (
        <StatusPill
          variant={
            a.status === "PRESENT"
              ? "success"
              : a.status === "LATE" || a.status === "EARLY"
              ? "warning"
              : "danger"
          }
        >
          {a.status}
        </StatusPill>
      ),
    },
    {
      key: "corrections",
      header: "Audit History",
      render: (a) => (
        <div>
          {a.corrections && a.corrections.length > 0 ? (
            <span
              className="rounded bg-volt-400/20 text-volt-400 border border-volt-400/40 text-[10px] font-bold px-1.5 py-0.5"
              title={`Corrected by ${a.corrections[0]?.correctedBy}: "${a.corrections[0]?.reason}"`}
            >
              Corrected ({a.corrections.length})
            </span>
          ) : (
            <span className="text-chalk/30 text-[10px]">Unmodified</span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (a) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenCorrection(a)}
          className="gap-1 text-xs text-volt-400 hover:text-volt-300"
        >
          <Edit3 className="size-3" /> Correct Punch
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biometric Attendance & Clock Management"
        subtitle="Live staff punch logs, late/early flags, and audited punch corrections with mandatory justification (HR-03)."
      />

      {/* Embedded Live Clock Terminal */}
      <ClockWidget
        employeeId="EMP-001"
        employeeName="Aarav Sharma"
        onClockStatusChange={() => toast.info("Attendance stream updated.")}
      />

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
            <Input
              placeholder="Search employee or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-chalk/60 font-mono">Status:</span>
            {["ALL", "PRESENT", "LATE", "EARLY", "ABSENT"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors border",
                  selectedStatus === st
                    ? "bg-volt-400 text-ink-900 border-volt-400 font-bold"
                    : "bg-court-700/60 border-chalk/10 text-chalk/70 hover:text-chalk"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Table
        data={filteredAttendance}
        columns={columns}
        keyExtractor={(a) => a.id}
        emptyTitle="No attendance records found"
        emptySubtitle="No staff punch records match the selected filter."
      />

      {/* Punch Correction Modal */}
      <Modal
        isOpen={isCorrectionModalOpen}
        onClose={() => setIsCorrectionModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <Edit3 className="size-4" />
            </div>
            <span>
              Audited Punch Correction · {correctingRecord?.employeeName}
            </span>
          </div>
        }
      >
        <form onSubmit={handleSaveCorrection} className="space-y-4 text-xs">
          <p className="text-chalk/80 leading-relaxed">
            Manual time corrections update payroll calculation hours directly. All modifications are logged with your user signature.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-chalk/80">Corrected Clock In</label>
              <Input
                type="time"
                value={newClockIn}
                onChange={(e) => setNewClockIn(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-chalk/80">Corrected Clock Out</label>
              <Input
                type="time"
                value={newClockOut}
                onChange={(e) => setNewClockOut(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-chalk/80">
              Mandatory Audit Reason <span className="text-danger">*</span>
            </label>
            <Input
              placeholder="e.g. Biometric scanner malfunction at Front Desk Terminal"
              value={correctionReason}
              onChange={(e) => {
                setCorrectionReason(e.target.value);
                setReasonError("");
              }}
              required
            />
            {reasonError && <p className="text-danger text-[11px] mt-1">{reasonError}</p>}
          </div>

          <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-3 text-[11px] text-chalk/60 space-y-1">
            <p className="font-semibold text-chalk flex items-center gap-1">
              <ShieldAlert className="size-3.5 text-volt-400" /> Compliance Logged
            </p>
            <p>Actor: Sunita Deshmukh (Admin) · Timestamp: {new Date().toLocaleString("en-IN")}</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Audited Correction
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
