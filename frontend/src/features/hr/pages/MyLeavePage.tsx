import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { LeaveBalanceRing } from "../components/LeaveBalanceRing";
import type { LeaveRequest, LeaveType } from "../types";
import {
  Plane,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
} from "lucide-react";
import { toast } from "sonner";

export default function MyLeavePage() {
  const { user } = useAuth();
  const { employees, leaveRequests, applyLeave } = useHrStore();

  const currentEmployee =
    employees.find((e) => e.email === user?.email) || employees[0]!;

  const myRequests = leaveRequests.filter((l) => l.employeeId === currentEmployee.id);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>("CASUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState("");

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!startDate || !endDate || !reason.trim()) {
      setFormError("All fields are required.");
      return;
    }

    const days = calculateDays();

    // BR-13 validation check
    if (leaveType !== "UNPAID") {
      const key = leaveType.toLowerCase() as "casual" | "sick" | "earned";
      const bal = currentEmployee.leaveBalances[key];
      const available = bal.total - bal.used;

      if (days > available) {
        setFormError(
          `Cannot apply for ${days} days. Your available ${leaveType} balance is only ${available} days (BR-13). Please choose Unpaid Leave if you require extended time off.`
        );
        return;
      }
    }

    const res = applyLeave({
      employeeId: currentEmployee.id,
      leaveType,
      startDate,
      endDate,
      daysCount: days,
      reason: reason.trim(),
    });

    if (res.success) {
      setIsApplyModalOpen(false);
      setStartDate("");
      setEndDate("");
      setReason("");
      setFormError("");
    } else {
      setFormError(res.message || "Failed to submit request.");
    }
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: "leaveType",
      header: "Leave Category",
      render: (req) => (
        <span className="rounded bg-court-700 px-2 py-0.5 text-xs font-bold text-chalk border border-chalk/10">
          {req.leaveType}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Dates & Duration",
      render: (req) => (
        <div className="font-mono text-xs">
          <p className="text-chalk font-semibold">
            {req.startDate} to {req.endDate}
          </p>
          <span className="text-[11px] text-chalk/60">{req.daysCount} Day(s)</span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason & Notes",
      render: (req) => (
        <div className="max-w-xs text-xs">
          <p className="text-chalk/80">{req.reason}</p>
          {req.approvalComment && (
            <p className="text-[11px] text-volt-400 mt-0.5">Admin Note: "{req.approvalComment}"</p>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (req) => (
        <StatusPill variant={req.status === "APPROVED" ? "success" : req.status === "PENDING" ? "warning" : "danger"}>
          {req.status}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Leave Balances & Time-Off Requests"
        subtitle={`Annual time-off balances, request submissions, and supervisor approvals for ${currentEmployee.name} (HR-04, BR-13).`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsApplyModalOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-3.5" /> Apply for Leave
          </Button>
        }
      />

      {/* Leave Balance Rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <LeaveBalanceRing
          label="Casual Leave (CL)"
          total={currentEmployee.leaveBalances.casual.total}
          used={currentEmployee.leaveBalances.casual.used}
          color="stroke-sky-400"
        />
        <LeaveBalanceRing
          label="Medical / Sick Leave (SL)"
          total={currentEmployee.leaveBalances.sick.total}
          used={currentEmployee.leaveBalances.sick.used}
          color="stroke-amber-400"
        />
        <LeaveBalanceRing
          label="Earned / Privilege (EL)"
          total={currentEmployee.leaveBalances.earned.total}
          used={currentEmployee.leaveBalances.earned.used}
          color="stroke-emerald-400"
        />
        <LeaveBalanceRing
          label="Unpaid Leave (LWP)"
          total={currentEmployee.leaveBalances.unpaid.total}
          used={currentEmployee.leaveBalances.unpaid.used}
          color="stroke-rose-400"
        />
      </div>

      {/* Personal Leave History */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-chalk">My Time-Off Requests</h3>
          </div>
          <span className="text-xs text-chalk/50 font-mono">
            {myRequests.length} requests on record
          </span>
        </div>

        <Table
          data={myRequests}
          columns={columns}
          keyExtractor={(req) => req.id}
          emptyTitle="No leave requests found"
          emptySubtitle="Click 'Apply for Leave' above to submit a time-off request."
        />
      </Card>

      {/* Apply for Leave Modal */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        maxWidth="md"
        title={
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-full bg-volt-400/20 text-volt-400">
              <Plane className="size-4" />
            </div>
            <span>Apply for Time Off</span>
          </div>
        }
      >
        <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-medium text-chalk/80">Leave Category *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              className="w-full h-11 rounded-[14px] bg-white/8 border border-white/18 px-3.5 text-xs text-chalk focus:border-volt-400 focus:outline-none"
            >
              <option value="CASUAL" className="bg-navy-800">
                Casual Leave ({currentEmployee.leaveBalances.casual.total - currentEmployee.leaveBalances.casual.used} days left)
              </option>
              <option value="SICK" className="bg-navy-800">
                Sick / Medical Leave ({currentEmployee.leaveBalances.sick.total - currentEmployee.leaveBalances.sick.used} days left)
              </option>
              <option value="EARNED" className="bg-navy-800">
                Earned / Paid Leave ({currentEmployee.leaveBalances.earned.total - currentEmployee.leaveBalances.earned.used} days left)
              </option>
              <option value="UNPAID" className="bg-navy-800">
                Unpaid Leave / Leave Without Pay (Unlimited)
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-medium text-chalk/80">From Date *</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="font-medium text-chalk/80">To Date *</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          {startDate && endDate && (
            <div className="rounded-lg bg-court-700/60 p-2.5 text-right font-mono text-[11px] text-chalk/80">
              Total Requested Duration: <strong className="text-volt-400">{calculateDays()} Day(s)</strong>
            </div>
          )}

          <div className="space-y-1">
            <label className="font-medium text-chalk/80">Reason for Leave *</label>
            <Input
              placeholder="e.g. Attending family function in Pune / Viral flu recovery"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="rounded-xl border border-chalk/10 bg-court-700/40 p-3 text-[11px] text-chalk/60 space-y-1">
            <p className="font-semibold text-chalk flex items-center gap-1">
              <Info className="size-3 text-volt-400" /> Club Attendance Policy (BR-13)
            </p>
            <p>
              Leave cannot exceed your earned/accrued balance unless chosen as Unpaid. Once approved by management, your roster cell will be locked and peers notified.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-chalk/10">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsApplyModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
