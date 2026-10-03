import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Table, type Column } from "@/components/ui/Table";
import { useAdminOpsStore } from "../adminOpsStore";
import type { AdminOverrideRecord } from "../types";
import {
  ShieldAlert,
  PlusCircle,
  Search,
  Filter,
  UserCheck,
  Calendar,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

const SAMPLE_MEMBERS = [
  { id: "CC-000123", name: "Pratham Patel", tier: "Gold Member", currentCap: 2 },
  { id: "CC-000144", name: "Ananya Iyer", tier: "Gold Member", currentCap: 2 },
  { id: "CC-000189", name: "Vikram Malhotra", tier: "Silver Member", currentCap: 2 },
  { id: "CC-000210", name: "Rohan Varma", tier: "Gold Member", currentCap: 2 },
  { id: "CC-000305", name: "Kunal Shah", tier: "Guest / Trial", currentCap: 1 },
];

export default function AdminOverridesPage() {
  const { overrides, grantCapOverride } = useAdminOpsStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);

  // Grant Modal form state
  const [selectedMemberId, setSelectedMemberId] = useState(SAMPLE_MEMBERS[0]?.id || "CC-000123");
  const [targetDate, setTargetDate] = useState("2026-10-06");
  const [maxBookings, setMaxBookings] = useState(4);
  const [overrideReason, setOverrideReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  const filteredOverrides = useMemo(() => {
    return overrides.filter((item) => {
      const matchesSearch =
        item.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.approvedBy.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [overrides, searchQuery, typeFilter]);

  const handleOpenGrantModal = () => {
    setSelectedMemberId(SAMPLE_MEMBERS[0]?.id || "CC-000123");
    setTargetDate(new Date(Date.now() + 86400000).toISOString().split("T")[0] || "2026-10-06");
    setMaxBookings(4);
    setOverrideReason("");
    setReasonError("");
    setIsGrantModalOpen(true);
  };

  const handleGrantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      setReasonError("A mandatory administrative justification is required.");
      return;
    }

    const member = SAMPLE_MEMBERS.find((m) => m.id === selectedMemberId);
    if (!member) return;

    grantCapOverride({
      memberId: member.id,
      memberName: member.name,
      targetDate,
      maxBookings,
      reason: overrideReason.trim(),
    });

    setIsGrantModalOpen(false);
  };

  const columns: Column<AdminOverrideRecord>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs text-white/90">
            {new Date(item.timestamp).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-[11px] text-white/50">
            {new Date(item.timestamp).toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "type",
      header: "Override Type",
      render: (item) => {
        let variant: "volt" | "warning" | "info" = "volt";
        let label = "Daily Cap";
        if (item.type === "PRICE_OVERRIDE") {
          variant = "warning";
          label = "Price Waiver";
        } else if (item.type === "TIER_DISCOUNT") {
          variant = "info";
          label = "Tier Discount";
        }
        return <StatusPill variant={variant}>{label}</StatusPill>;
      },
    },
    {
      key: "member",
      header: "Member Details",
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-white">{item.memberName}</span>
          <span className="font-mono text-[11px] text-volt-400/80">{item.memberId}</span>
        </div>
      ),
    },
    {
      key: "targetDate",
      header: "Target Date",
      render: (item) => (
        <span className="font-mono text-xs text-white/80">
          {new Date(item.targetDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "modification",
      header: "Modification (Before → After)",
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="line-through text-white/40">{item.beforeValue}</span>
          <span className="text-white/40">→</span>
          <span className="font-semibold text-volt-400 bg-volt-400/10 px-2 py-0.5 rounded-md border border-volt-400/20">
            {item.afterValue}
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      header: "Audit Justification",
      render: (item) => (
        <span className="text-xs text-white/80 line-clamp-2 max-w-xs" title={item.reason}>
          {item.reason}
        </span>
      ),
    },
    {
      key: "approvedBy",
      header: "Approved By",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5 text-volt-400 shrink-0" />
          <span className="text-xs font-medium text-white/90">{item.approvedBy}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Overrides & Waivers"
        subtitle="Permanent audit trail of daily booking cap adjustments, pricing overrides, and promotional rate approvals."
        actions={
          <Button variant="primary" onClick={handleOpenGrantModal} className="flex items-center gap-2">
            <PlusCircle className="size-4" />
            <span>Grant Cap Override</span>
          </Button>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Total Overrides Logged</span>
            <ShieldAlert className="size-4 text-volt-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{overrides.length}</div>
          <span className="text-[11px] text-white/50">Audited in system database</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Cap Expansions Active</span>
            <Calendar className="size-4 text-volt-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-volt-400">
            {overrides.filter((o) => o.type === "DAILY_CAP").length}
          </div>
          <span className="text-[11px] text-white/50">Permitted beyond 2 bookings/day</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Price Waivers</span>
            <FileCheck className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {overrides.filter((o) => o.type === "PRICE_OVERRIDE").length}
          </div>
          <span className="text-[11px] text-white/50">Exhibition & tournament exemptions</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Rate Exceptions</span>
            <UserCheck className="size-4 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-blue-400">
            {overrides.filter((o) => o.type === "TIER_DISCOUNT").length}
          </div>
          <span className="text-[11px] text-white/50">Goodwill & loyalty adjustments</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-court-500 border-white/14">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              placeholder="Search member, ID, approver, reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400 focus:ring-2 focus:ring-volt-400/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter className="size-4 text-white/50" />
            <span className="text-xs text-white/60">Type:</span>
            <div className="flex rounded-lg bg-white/6 p-1 border border-white/10">
              {[
                { id: "ALL", label: "All" },
                { id: "DAILY_CAP", label: "Daily Cap" },
                { id: "PRICE_OVERRIDE", label: "Price Waiver" },
                { id: "TIER_DISCOUNT", label: "Tier Discount" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    typeFilter === tab.id
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Overrides Table */}
      <Card className="p-0 overflow-hidden bg-court-500 border-white/14">
        <Table
          data={filteredOverrides}
          columns={columns}
          keyExtractor={(item) => item.id}
          emptyTitle="No Overrides Found"
          emptySubtitle="No administrative overrides match your current filter criteria."
        />
      </Card>

      {/* Grant Daily Cap Override Modal */}
      <Modal
        isOpen={isGrantModalOpen}
        onClose={() => setIsGrantModalOpen(false)}
        title="Grant Booking Cap Override"
        subtitle="Temporarily elevate the standard 2 bookings per day limit for an authorized member."
      >
        <form onSubmit={handleGrantSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Select Member *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-sm text-white focus:outline-none focus:border-volt-400"
            >
              {SAMPLE_MEMBERS.map((m) => (
                <option key={m.id} value={m.id} className="bg-navy-800 text-white">
                  {m.name} ({m.tier}) — Default Cap: {m.currentCap}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Target Date *
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/8 border border-white/18 text-sm text-white focus:outline-none focus:border-volt-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                Elevated Cap Limit *
              </label>
              <select
                value={maxBookings}
                onChange={(e) => setMaxBookings(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-xl bg-navy-800 border border-white/18 text-sm text-white focus:outline-none focus:border-volt-400"
              >
                <option value={3}>3 Bookings / Day (+1)</option>
                <option value={4}>4 Bookings / Day (+2)</option>
                <option value={5}>5 Bookings / Day (+3)</option>
                <option value={8}>8 Bookings / Day (Full Day Clinic)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/80 mb-1.5">
              Administrative Justification *
            </label>
            <textarea
              rows={3}
              value={overrideReason}
              onChange={(e) => {
                setOverrideReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="e.g. Hosting visiting corporate delegates; approved tournament squad preparation..."
              className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
            />
            {reasonError && (
              <span className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {reasonError}
              </span>
            )}
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70">
            <span className="font-semibold text-volt-400">Notice:</span> This action will be
            permanently recorded in the compliance audit ledger under your administrator credentials.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <Button type="button" variant="ghost" onClick={() => setIsGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Grant & Log Override
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
