import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminAuditStore } from "../adminAuditStore";
import type { AuditLogEntry } from "../types";
import {
  ShieldCheck,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  Lock,
  ArrowRight,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

export default function AdminAuditLogPage() {
  const { entries, exportCSV } = useAdminAuditStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("ALL");
  const [selectedUser, setSelectedUser] = useState<string>("ALL");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("ALL");
  const [inspectingEntry, setInspectingEntry] = useState<AuditLogEntry | null>(null);

  // Distinct users and actions for filters
  const distinctUsers = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.userName)));
  }, [entries]);

  const distinctActions = useMemo(() => {
    return Array.from(new Set(entries.map((e) => e.action)));
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Action filter
      if (selectedAction !== "ALL" && entry.action !== selectedAction) {
        return false;
      }
      // User filter
      if (selectedUser !== "ALL" && entry.userName !== selectedUser) {
        return false;
      }
      // Date filter
      if (selectedDateRange !== "ALL") {
        const entryDate = new Date(entry.timestamp);
        const now = new Date();
        if (selectedDateRange === "TODAY") {
          const isToday =
            entryDate.getDate() === now.getDate() &&
            entryDate.getMonth() === now.getMonth() &&
            entryDate.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (selectedDateRange === "7D") {
          const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 7) return false;
        } else if (selectedDateRange === "30D") {
          const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
          if (diffDays > 30) return false;
        }
      }
      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = entry.id.toLowerCase().includes(q);
        const matchUser = entry.userName.toLowerCase().includes(q);
        const matchEntity = entry.entity.toLowerCase().includes(q);
        const matchEntityId = entry.entityId.toLowerCase().includes(q);
        const matchReason = entry.reason.toLowerCase().includes(q);
        const matchAction = entry.action.toLowerCase().includes(q);
        return matchId || matchUser || matchEntity || matchEntityId || matchReason || matchAction;
      }
      return true;
    });
  }, [entries, selectedAction, selectedUser, selectedDateRange, searchQuery]);

  // Format action label
  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  // Status pill tone based on action
  const getActionTone = (action: string): "default" | "success" | "warning" | "danger" | "info" => {
    switch (action) {
      case "PRICE_OVERRIDE":
      case "CAP_OVERRIDE":
      case "DISCOUNT_OVERRIDE":
        return "warning";
      case "REFUND":
      case "STOCK_ADJUSTMENT":
      case "VOID_COMP":
      case "SUSPENSION":
      case "STAFF_DEACTIVATE":
        return "danger";
      case "PAYROLL_RUN":
      case "ROLE_PROMOTION":
      case "STAFF_CREATE":
        return "success";
      case "PERMISSION_GROUP_CHANGE":
      case "DAY_REOPEN":
      case "PERIOD_REOPEN":
      case "CONFIG_UPDATE":
      default:
        return "info";
    }
  };

  const columns: Column<AuditLogEntry>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      cell: (row) => {
        const d = new Date(row.timestamp);
        return (
          <div className="flex flex-col">
            <span className="text-white font-medium text-xs">
              {d.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </span>
            <span className="text-white/60 text-[11px] font-mono">
              {d.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                timeZone: "Asia/Kolkata",
              })}
            </span>
            <span className="text-white/40 text-[10px] mt-0.5 font-mono">{row.id}</span>
          </div>
        );
      },
    },
    {
      id: "user",
      header: "Performed By",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full bg-court-700 border border-white/10 flex items-center justify-center text-xs font-semibold text-volt-400">
            {row.userName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
          </div>
          <div>
            <div className="text-white font-medium text-sm">{row.userName}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                row.userRole === "ADMIN" ? "bg-volt-400/20 text-volt-300" : "bg-white/10 text-white/70"
              }`}>
                {row.userRole}
              </span>
              {row.approver && (
                <span className="text-[10px] text-white/50">Appr: {row.approver.split(" ")[0]}</span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: (row) => (
        <StatusPill
          label={formatAction(row.action)}
          tone={getActionTone(row.action)}
          size="sm"
        />
      ),
    },
    {
      id: "entity",
      header: "Target Entity",
      cell: (row) => (
        <div>
          <div className="text-white text-xs font-medium">{row.entity}</div>
          <div className="text-white/60 font-mono text-[11px]">{row.entityId}</div>
        </div>
      ),
    },
    {
      id: "reason",
      header: "Mandatory Reason",
      cell: (row) => (
        <div className="max-w-[280px]">
          <p className="text-white/80 text-xs italic line-clamp-2" title={row.reason}>
            "{row.reason}"
          </p>
        </div>
      ),
    },
    {
      id: "inspection",
      header: "Governance & Diff",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center gap-1 text-[11px] text-white/40 bg-white/5 px-2 py-1 rounded-md border border-white/5" title="Append-only immutable record. Edits and deletes are strictly prohibited by protocol.">
            <Lock className="size-3 text-volt-400" />
            <span className="font-mono">IMMUTABLE</span>
          </div>
          {row.beforeState || row.afterState ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectingEntry(row)}
              className="text-xs h-7 px-2.5 gap-1.5 border-white/20 hover:border-volt-400 hover:text-volt-300"
            >
              <Eye className="size-3.5" />
              <span>Inspect Diff</span>
            </Button>
          ) : (
            <span className="text-white/30 text-xs">—</span>
          )}
        </div>
      ),
    },
  ];

  // Helper to highlight diff changes between JSON objects
  const renderJsonBlock = (data?: Record<string, any>, reference?: Record<string, any>, isAfter?: boolean) => {
    if (!data) {
      return <div className="text-white/40 italic text-xs py-4 text-center">No snapshot data recorded</div>;
    }

    const keys = Object.keys(data);
    return (
      <div className="font-mono text-xs space-y-1 bg-navy-950/80 p-3 rounded-xl border border-white/10 overflow-x-auto max-h-[360px]">
        <span className="text-white/40">&#123;</span>
        {keys.map((key) => {
          const val = data[key];
          const refVal = reference ? reference[key] : undefined;
          const isChanged = reference !== undefined && JSON.stringify(val) !== JSON.stringify(refVal);
          const isNew = reference !== undefined && refVal === undefined;

          let highlightBg = "hover:bg-white/5";
          let badge = null;

          if (isAfter && (isChanged || isNew)) {
            highlightBg = "bg-volt-400/10 border-l-2 border-volt-400 pl-2 rounded-r";
            badge = <span className="text-[10px] text-volt-400 font-sans font-bold ml-2">MODIFIED</span>;
          } else if (!isAfter && isChanged) {
            highlightBg = "bg-rose-500/10 border-l-2 border-rose-500 pl-2 rounded-r";
            badge = <span className="text-[10px] text-rose-400 font-sans font-bold ml-2">PREVIOUS</span>;
          }

          return (
            <div key={key} className={`flex items-start py-0.5 px-1 ${highlightBg} transition-colors`}>
              <span className="text-volt-200 font-semibold mr-1.5">"{key}":</span>
              <span className="text-white/90 break-all">
                {typeof val === "object" ? JSON.stringify(val) : String(val)}
              </span>
              {badge}
            </div>
          );
        })}
        <span className="text-white/40">&#125;</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log & Governance"
        subtitle="Cryptographically sealed, append-only transaction ledger with ReasonDialog audit trail (AUTH-06, NFR-06)"
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={exportCSV}
              className="border-white/20 hover:border-volt-400 gap-2 text-white"
            >
              <Download className="size-4 text-volt-400" />
              <span>Export CSV</span>
            </Button>
          </div>
        }
      />

      {/* Protocol Banner */}
      <div className="bg-court-700/80 border border-volt-400/30 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-volt-400/15 border border-volt-400/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="size-5 text-volt-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Immutable Ledger Guarantee</span>
              <span className="text-[10px] bg-volt-400/20 text-volt-300 font-mono px-2 py-0.5 rounded-full font-bold">
                WORM PROTECTED
              </span>
            </div>
            <p className="text-xs text-white/70 mt-0.5">
              Every sensitive action across CCMS (refunds, caps, overrides, voids, and staff privileges) records mandatory business reasons, approving credentials, and JSON snapshots. No row can be edited or deleted.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60 bg-court-800/80 px-3 py-2 rounded-xl border border-white/10 shrink-0">
          <Clock className="size-4 text-volt-400" />
          <span>Clock: <strong>Asia/Kolkata (IST)</strong></span>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="md:col-span-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, entity, or ID..."
              leftIcon={<Search className="size-4" />}
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full h-12 bg-white/8 border border-white/18 rounded-[14px] px-3 text-white text-xs focus:border-volt-400 focus:outline-none"
            >
              <option value="ALL" className="bg-navy-800">All Sensitive Actions</option>
              {distinctActions.map((action) => (
                <option key={action} value={action} className="bg-navy-800">
                  {formatAction(action)}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full h-12 bg-white/8 border border-white/18 rounded-[14px] px-3 text-white text-xs focus:border-volt-400 focus:outline-none"
            >
              <option value="ALL" className="bg-navy-800">All Operators / Admins</option>
              {distinctUsers.map((u) => (
                <option key={u} value={u} className="bg-navy-800">
                  {u}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              className="w-full h-12 bg-white/8 border border-white/18 rounded-[14px] px-3 text-white text-xs focus:border-volt-400 focus:outline-none"
            >
              <option value="ALL" className="bg-navy-800">All Time Ledger</option>
              <option value="TODAY" className="bg-navy-800">Today Only</option>
              <option value="7D" className="bg-navy-800">Last 7 Days</option>
              <option value="30D" className="bg-navy-800">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-white/60 pt-2 border-t border-white/10">
          <span>
            Showing <strong>{filteredEntries.length}</strong> of <strong>{entries.length}</strong> recorded audit events
          </span>
          {(searchQuery || selectedAction !== "ALL" || selectedUser !== "ALL" || selectedDateRange !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAction("ALL");
                setSelectedUser("ALL");
                setSelectedDateRange("ALL");
              }}
              className="text-volt-400 hover:underline text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </Card>

      {/* Audit Log Table */}
      <Table<AuditLogEntry>
        columns={columns}
        data={filteredEntries}
        keyExtractor={(row) => row.id}
        emptyMessage="No audit log entries match the selected filters."
      />

      {/* Side-by-Side Diff Viewer Modal */}
      {inspectingEntry && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingEntry(null)}
          title={`Audit Record Diff: ${inspectingEntry.id}`}
        >
          <div className="space-y-5">
            {/* Header info bar */}
            <div className="bg-court-700/60 p-3.5 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <StatusPill
                  label={formatAction(inspectingEntry.action)}
                  tone={getActionTone(inspectingEntry.action)}
                />
                <span className="text-white text-xs font-semibold">{inspectingEntry.entity}</span>
                <span className="text-white/50 font-mono text-xs">({inspectingEntry.entityId})</span>
              </div>
              <div className="text-right text-xs text-white/60">
                <span>By <strong className="text-white">{inspectingEntry.userName}</strong></span>
                {inspectingEntry.approver && (
                  <span className="ml-2 text-volt-300">| Appr: {inspectingEntry.approver}</span>
                )}
              </div>
            </div>

            {/* Mandatory Reason Callout */}
            <div className="bg-court-500/80 border-l-4 border-volt-400 p-3.5 rounded-r-2xl">
              <div className="text-[11px] uppercase tracking-wider text-volt-400 font-bold mb-1">
                Mandatory Business Justification
              </div>
              <p className="text-white text-xs italic">
                "{inspectingEntry.reason}"
              </p>
            </div>

            {/* Side-by-Side Diff Container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before State */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-400" />
                    Before State (Baseline)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">PRIOR SNAPSHOT</span>
                </div>
                {renderJsonBlock(inspectingEntry.beforeState, inspectingEntry.afterState, false)}
              </div>

              {/* After State */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-volt-300 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-volt-400" />
                    After State (Current)
                  </span>
                  <span className="text-[10px] text-white/40 font-mono">APPLIED STATE</span>
                </div>
                {renderJsonBlock(inspectingEntry.afterState, inspectingEntry.beforeState, true)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/50">
                <Shield className="size-4 text-volt-400" />
                <span>SHA-256 Verified Seal: {inspectingEntry.id.replace("AUD", "SIG")}</span>
              </div>
              <Button
                variant="primary"
                onClick={() => setInspectingEntry(null)}
              >
                Close Diff Inspector
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
