import { useState, useMemo } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Modal } from "@/components/ui/Modal";
import { useAdminOpsStore } from "../adminOpsStore";
import type { AdminApprovalItem, ApprovalType } from "../types";
import {
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  FileText,
  AlertCircle,
  Filter,
  Search,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Wine,
  RotateCcw,
  CalendarDays,
  UserCheck,
} from "lucide-react";
import { toast } from "@/components/ui/Toast";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminApprovalsPage() {
  const { approvals, approveItem, rejectItem } = useAdminOpsStore();

  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Review Action
  const [activeItem, setActiveItem] = useState<AdminApprovalItem | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [commentError, setCommentError] = useState("");

  const filteredItems = useMemo(() => {
    return approvals.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesType = typeFilter === "ALL" || item.type === typeFilter;
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.entityRef && item.entityRef.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [approvals, statusFilter, typeFilter, searchQuery]);

  const pendingCount = approvals.filter((i) => i.status === "PENDING").length;
  const approvedCount = approvals.filter((i) => i.status === "APPROVED").length;
  const rejectedCount = approvals.filter((i) => i.status === "REJECTED").length;
  const totalPendingValue = approvals
    .filter((i) => i.status === "PENDING" && i.amount)
    .reduce((sum, i) => sum + (i.amount || 0), 0);

  const openReviewModal = (item: AdminApprovalItem, action: "APPROVE" | "REJECT") => {
    setActiveItem(item);
    setReviewAction(action);
    setReviewComment(
      action === "APPROVE" ? "Approved in accordance with club policy." : "Declined per manager review."
    );
    setCommentError("");
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !reviewAction) return;

    if (!reviewComment.trim()) {
      setCommentError("Mandatory review comment is required.");
      return;
    }

    if (reviewAction === "APPROVE") {
      approveItem(activeItem.id, "Sunita Deshmukh (Admin)", reviewComment.trim());
    } else {
      rejectItem(activeItem.id, "Sunita Deshmukh (Admin)", reviewComment.trim());
    }

    setActiveItem(null);
    setReviewAction(null);
    setReviewComment("");
  };

  const getTypeIcon = (type: ApprovalType) => {
    switch (type) {
      case "TAB_TRANSFER":
        return <UserCheck className="size-4 text-volt-400" />;
      case "VOID_COMP":
        return <Wine className="size-4 text-amber-400" />;
      case "STOCK_WRITEOFF":
        return <ShoppingBag className="size-4 text-rose-400" />;
      case "BAR_REOPEN":
        return <RotateCcw className="size-4 text-blue-400" />;
      case "REFUND":
        return <DollarSign className="size-4 text-emerald-400" />;
      case "LEAVE_APPROVAL":
        return <CalendarDays className="size-4 text-purple-400" />;
    }
  };

  const getTypeBadge = (type: ApprovalType) => {
    const labels: Record<ApprovalType, string> = {
      TAB_TRANSFER: "Tab Transfer",
      VOID_COMP: "Void / Comp",
      STOCK_WRITEOFF: "Stock Write-off",
      BAR_REOPEN: "Register Reopen",
      REFUND: "Refund Request",
      LEAVE_APPROVAL: "Staff Leave",
    };
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-white/8 px-2 py-0.5 text-[11px] font-medium text-white/80 border border-white/10">
        {getTypeIcon(type)}
        {labels[type]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Approvals Queue"
        subtitle="Review, audit, and authorize high-privilege operations requested by front-desk, bar, pro shop, and staff teams."
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Awaiting Decision</span>
            <Clock className="size-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">{pendingCount}</div>
          <span className="text-[11px] text-white/50">Requires administrator action</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Pending Financial Value</span>
            <DollarSign className="size-4 text-volt-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-volt-400">
            {formatCurrency(totalPendingValue)}
          </div>
          <span className="text-[11px] text-white/50">Across tabs, write-offs & refunds</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Approved Today</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400">{approvedCount}</div>
          <span className="text-[11px] text-white/50">Executed & ledger updated</span>
        </Card>

        <Card className="p-4 bg-court-500 border-white/14">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/70">Declined Requests</span>
            <XCircle className="size-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">{rejectedCount}</div>
          <span className="text-[11px] text-white/50">Returned with feedback</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-court-500 border-white/14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <input
              type="text"
              placeholder="Search title, description, staff member, ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-4 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Segmented Tabs */}
            <div className="flex rounded-lg bg-white/6 p-1 border border-white/10">
              {[
                { id: "PENDING", label: `Pending (${pendingCount})` },
                { id: "ALL", label: "All Items" },
                { id: "APPROVED", label: "Approved" },
                { id: "REJECTED", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    statusFilter === tab.id
                      ? "bg-volt-400 text-ink-900 shadow-sm"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Type Filter Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 px-3 rounded-lg bg-navy-800 border border-white/18 text-xs text-white focus:outline-none focus:border-volt-400"
            >
              <option value="ALL">All Categories</option>
              <option value="TAB_TRANSFER">Tab Transfers</option>
              <option value="VOID_COMP">Void / Comp</option>
              <option value="STOCK_WRITEOFF">Stock Write-offs</option>
              <option value="BAR_REOPEN">Register Reopens</option>
              <option value="REFUND">Refunds</option>
              <option value="LEAVE_APPROVAL">Staff Leave</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Approvals Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="p-12 text-center bg-court-500 border-white/14">
            <CheckCircle2 className="size-12 text-emerald-400/60 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white">All Caught Up!</h3>
            <p className="text-sm text-white/60 max-w-sm mx-auto mt-1">
              There are no pending requests matching your current selection. High-privilege staff
              requests will automatically appear here.
            </p>
          </Card>
        ) : (
          filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`p-5 transition-all bg-court-500 border-white/14 ${
                item.status === "PENDING"
                  ? "hover:border-volt-400/40"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: Type, Info, Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getTypeBadge(item.type)}
                    <span className="font-mono text-xs text-white/50">{item.id}</span>
                    {item.entityRef && (
                      <span className="font-mono text-xs text-volt-400/80 bg-volt-400/10 px-2 py-0.5 rounded border border-volt-400/20">
                        Ref: {item.entityRef}
                      </span>
                    )}
                    <StatusPill
                      variant={
                        item.status === "PENDING"
                          ? "warning"
                          : item.status === "APPROVED"
                          ? "success"
                          : "danger"
                      }
                    >
                      {item.status}
                    </StatusPill>
                  </div>

                  <h3 className="text-base font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/80 leading-relaxed">{item.description}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60 pt-1">
                    <span>
                      Requested by: <strong className="text-white/90">{item.requestedBy}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Submitted:{" "}
                      {new Date(item.requestedAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {item.reviewedBy && (
                      <>
                        <span>•</span>
                        <span className="text-volt-400">
                          Reviewed by {item.reviewedBy}: &ldquo;{item.reviewComment}&rdquo;
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/10 shrink-0">
                  {item.amount !== undefined && (
                    <div className="text-right">
                      <span className="text-xs text-white/60 block">Financial Value</span>
                      <span className="text-xl font-bold text-volt-400">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  )}

                  {item.status === "PENDING" ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => openReviewModal(item, "REJECT")}
                        className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs px-3 h-9"
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Reject
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => openReviewModal(item, "APPROVE")}
                        className="text-xs px-4 h-9"
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Approve
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-white/50">
                      <ShieldCheck className="size-4 text-white/40" />
                      <span>Decision finalized</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Review & Decision Modal */}
      <Modal
        isOpen={!!activeItem && !!reviewAction}
        onClose={() => {
          setActiveItem(null);
          setReviewAction(null);
        }}
        title={
          reviewAction === "APPROVE" ? (
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="size-5" />
              <span>Authorize Request</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-400">
              <XCircle className="size-5" />
              <span>Decline Request</span>
            </div>
          )
        }
        subtitle={
          activeItem
            ? `${activeItem.title} (${activeItem.id}) requested by ${activeItem.requestedBy}`
            : ""
        }
      >
        {activeItem && (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/6 border border-white/10 text-xs text-white/80 space-y-1">
              <p className="font-medium text-white">{activeItem.description}</p>
              {activeItem.amount && (
                <p className="text-volt-400 font-semibold">
                  Amount: {formatCurrency(activeItem.amount)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-white/80 mb-1.5">
                {reviewAction === "APPROVE"
                  ? "Approval Note & Audit Justification *"
                  : "Reason for Rejection (Returned to Staff) *"}
              </label>
              <textarea
                rows={3}
                value={reviewComment}
                onChange={(e) => {
                  setReviewComment(e.target.value);
                  if (commentError) setCommentError("");
                }}
                placeholder="Enter mandatory audit comments..."
                className="w-full p-3 rounded-xl bg-white/8 border border-white/18 text-sm text-white placeholder-white/40 focus:outline-none focus:border-volt-400"
                autoFocus
              />
              {commentError && (
                <span className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  {commentError}
                </span>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white/60">
              <ShieldCheck className="size-3.5 inline mr-1 text-volt-400" />
              Executing as Administrator: <strong>Sunita Deshmukh</strong>. This action is immutable
              and logged in system compliance logs.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setActiveItem(null);
                  setReviewAction(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant={reviewAction === "APPROVE" ? "primary" : "danger"}
              >
                {reviewAction === "APPROVE" ? "Confirm & Execute" : "Confirm Rejection"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
