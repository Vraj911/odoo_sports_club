import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useHrStore } from "../hrStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, type Column } from "@/components/ui/Table";
import { StatusPill } from "@/components/ui/StatusPill";
import { ClockWidget } from "../components/ClockWidget";
import type { AttendanceRecord } from "../types";
import { Fingerprint, Clock, History, Calendar, CheckCircle2 } from "lucide-react";

export default function MyClockPage() {
  const { user } = useAuth();
  const { employees, attendance } = useHrStore();

  const currentEmployee =
    employees.find((e) => e.email === user?.email) || employees[0]!;

  const myPunches = attendance.filter((a) => a.employeeId === currentEmployee.id);

  const columns: Column<AttendanceRecord>[] = [
    {
      key: "date",
      header: "Date",
      render: (a) => <span className="font-mono text-xs text-chalk font-semibold">{a.date}</span>,
    },
    {
      key: "shift",
      header: "Assigned Shift",
      render: (a) => <span className="text-xs text-chalk/70">{a.shift}</span>,
    },
    {
      key: "clockIn",
      header: "Clock In",
      render: (a) => (
        <span className="font-mono text-xs font-bold text-emerald-400">
          {a.clockIn || "—"}
        </span>
      ),
    },
    {
      key: "clockOut",
      header: "Clock Out",
      render: (a) => (
        <span className="font-mono text-xs font-bold text-volt-400">
          {a.clockOut || "—"}
        </span>
      ),
    },
    {
      key: "totalHours",
      header: "Hours Logged",
      render: (a) => (
        <span className="font-mono text-xs font-bold text-chalk">
          {a.totalHours !== undefined ? `${a.totalHours} hrs` : "In Progress"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (a) => (
        <StatusPill variant={a.status === "PRESENT" ? "success" : a.status === "LATE" || a.status === "EARLY" ? "warning" : "danger"}>
          {a.status}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Time Clock & Shift Punches"
        subtitle={`Live clock terminal and attendance log for ${currentEmployee.name} (${currentEmployee.id}).`}
      />

      {/* Clock Widget */}
      <ClockWidget
        employeeId={currentEmployee.id}
        employeeName={currentEmployee.name}
      />

      {/* Personal Punch History */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="size-4 text-volt-400" />
            <h3 className="text-sm font-semibold text-chalk">My Recent Shift Logs</h3>
          </div>
          <span className="text-xs text-chalk/50 font-mono">
            {myPunches.length} recorded sessions
          </span>
        </div>

        <Table
          data={myPunches}
          columns={columns}
          keyExtractor={(a) => a.id}
          emptyTitle="No punch records found"
          emptySubtitle="You have no recorded shift sessions yet."
        />
      </Card>
    </div>
  );
}
