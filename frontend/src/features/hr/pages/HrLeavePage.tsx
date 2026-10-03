import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import type { LeaveRequest } from "../types";
import {
  Plane,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  Building,
  User,
  Clock,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

export default function HrLeavePage() {
  const go = useGo();
  const { leaveRequests, employees, approveLeave, rejectLeave } = useHrStore();

  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const pendingRequests = leaveRequests.filter((l) => l.status === "PENDING");
  const processedRequests = leaveRequests.filter((l) => l.status !== "PENDING");

  const handleApprove = (req: LeaveRequest) => {
    const comment = commentMap[req.id] || "Approved by Management";
    approveLeave(req.id, "Sunita Deshmukh (Admin)", comment);
  };

  const handleReject = (req: LeaveRequest) => {
    const comment = commentMap[req.id] || "Rejected due to operational constraints";
    rejectLeave(req.id, "Sunita Deshmukh (Admin)", comment);
  };

  const columns: Column<LeaveRequest>[] = [
    {
      key: "employee",
      header: "Employee & Department",
      render: (req) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-chalk text-xs">{req.employeeName}</p>
          <p className="text-[11px] text-chalk/50 font-mono">
            {req.employeeId} · {req.department.replace("_", " ")}
          </p>
        </div>
      ),
    },
    {
      key: "leaveType",
      header: "Leave Type",
      render: (req) => (
        <span className="rounded px-2 py-0.5 text-[11px] font-bold bg-court-700 border border-chalk/10 text-chalk">
          {req.leaveType}
        </span>
      ),
    },
    {
      key: "dates",
      header: "Dates & Duration",
      render: (req) => (
        <div className="font-mono text-xs">
          <p className="text-chalk">{req.startDate} to {req.endDate}</p>
          <span className="text-[11px] text-chalk/60">{req.daysCount} day(s)</span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Reason & Notes",
      render: (req) => (
        <div className="max-w-xs text-xs text-chalk/80">
          <p className="line-clamp-2">{req.reason}</p>
          {req.approvalComment && (
            <p className="text-[11px] text-chalk/50 italic mt-0.5">Note: "{req.approvalComment}"</p>
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
        title="Leave Approvals & Time-Off Management"
        subtitle="Review staff requests, inspect roster coverage warnings, update leave balances, and sync schedule blocks (HR-04, HR-05, BR-13)."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => go("/admin/leave-types")}
            className="gap-1.5"
          >
            Leave Types Config (/admin/leave-types) <ExternalLink className="size-3" />
          </Button>
        }
      />

      {/* Pending Leave Requests Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-chalk flex items-center gap-2">
            <Plane className="size-4 text-volt-400" /> Pending Approval Queue ({pendingRequests.length})
          </h3>
          <span className="text-xs text-chalk/60 font-mono">
            Requires Administrator Sign-off
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <Card className="p-8 text-center text-chalk/60">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-emerald-400" />
            <p className="text-sm font-semibold text-chalk">No pending leave requests</p>
            <p className="text-xs text-chalk/50 mt-1">All staff time-off requests have been reviewed.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {pendingRequests.map((req) => {
              const emp = employees.find((e) => e.id === req.employeeId);
              const key = req.leaveType.toLowerCase() as "casual" | "sick" | "earned" | "unpaid";
              const currentBal = emp?.leaveBalances[key] || { total: 10, used: 0 };
              const remAfterApproval = Math.max(0, currentBal.total - (currentBal.used + req.daysCount));

              return (
                <Card
                  key={req.id}
                  className={cn(
                    "p-5 space-y-4 border transition-all",
                    req.coverageWarning
                      ? "border-amber-500/40 bg-court-500/90 shadow-lg"
                      : "border-chalk/14 bg-court-500"
                  )}
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={emp?.avatar}
                        alt={req.employeeName}
                        className="size-11 rounded-full object-cover border border-chalk/20 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-chalk text-sm">{req.employeeName}</h4>
                        <p className="text-[11px] text-chalk/60 font-mono">
                          {req.employeeId} · {req.department.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-volt-400/20 text-volt-400 border border-volt-400/40 text-[11px] font-bold px-2.5 py-0.5">
                      {req.leaveType} LEAVE
                    </span>
                  </div>

                  {/* Dates & Duration Banner */}
                  <div className="rounded-xl border border-chalk/10 bg-court-700/60 p-3 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <p className="text-chalk/60 text-[11px]">Requested Period</p>
                      <p className="font-bold font-mono text-chalk">
                        {req.startDate} to {req.endDate}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <p className="text-chalk/60 text-[11px]">Days</p>
                      <p className="font-black font-mono text-volt-400 text-sm">{req.daysCount} Day(s)</p>
                    </div>
                  </div>

                  {/* Balance Analysis */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-court-700/40 p-2.5">
                      <span className="text-chalk/50 text-[10px] uppercase block">Current Balance</span>
                      <span className="font-mono font-bold text-chalk">
                        {currentBal.total >= 999 ? "Unlimited" : `${currentBal.total - currentBal.used} Days Left`}
                      </span>
                    </div>
                    <div className="rounded-lg bg-court-700/40 p-2.5">
                      <span className="text-chalk/50 text-[10px] uppercase block">Remaining if Approved</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {currentBal.total >= 999 ? "Unlimited" : `${remAfterApproval} Days`}
                      </span>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="text-xs space-y-1">
                    <span className="text-chalk/50">Employee Stated Reason:</span>
                    <p className="p-2.5 rounded-lg bg-court-700/50 text-chalk/90 italic border border-chalk/10">
                      "{req.reason}"
                    </p>
                  </div>

                  {/* Critical Roster Coverage Warning Banner (if any) */}
                  {req.coverageWarning && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200 flex items-start gap-2.5">
                      <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block">Roster Staffing Warning</strong>
                        <p className="text-amber-200/90 text-[11px] mt-0.5 leading-relaxed">
                          {req.coverageWarning}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Supervisor Note Field & Actions */}
                  <div className="space-y-3 pt-2 border-t border-chalk/10">
                    <Input
                      placeholder="Optional approval note or condition..."
                      value={commentMap[req.id] || ""}
                      onChange={(e) =>
                        setCommentMap({ ...commentMap, [req.id]: e.target.value })
                      }
                      className="h-9 text-xs"
                    />

                    <div className="flex items-center justify-end gap-2.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(req)}
                        className="gap-1.5 text-xs text-rose-300 border-rose-500/30 hover:bg-rose-500/20"
                      >
                        <XCircle className="size-3.5" /> Reject
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApprove(req)}
                        className="gap-1.5 text-xs"
                      >
                        <CheckCircle2 className="size-3.5" /> Approve Leave
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Leave Records */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-semibold text-chalk">
          Processed Leave Requests & Audit Log
        </h3>
        <Table
          data={processedRequests}
          columns={columns}
          keyExtractor={(req) => req.id}
          emptyTitle="No processed leave history"
          emptySubtitle="No historical leave requests found."
        />
      </div>
    </div>
  );
}
