import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { Money } from "@/components/shared/Money";
import { toast } from "@/components/ui/Toast";
import { useGo } from "@/app/router/links";
import { useCan } from "@/lib/permissions";
import {
  Kanban,
  List,
  Plus,
  Search,
  Filter,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Lock,
  Building,
} from "lucide-react";
import { useCrmStore, crmActions, isLeadOverdue } from "../crmStore";
import { CRM_OWNERS } from "../sampleData";
import { LeadKanbanColumn } from "../components/LeadKanbanColumn";
import { LeadCard } from "../components/LeadCard";
import { NewLeadModal } from "../components/NewLeadModal";
import type { Lead, LeadStage, LeadSource } from "../types";

const STAGES: { key: LeadStage; label: string }[] = [
  { key: "NEW", label: "New Enquiry" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "TRIAL_BOOKED", label: "Trial Booked" },
  { key: "QUOTE_SENT", label: "Quote Sent" },
  { key: "WON", label: "Won / Member" },
  { key: "LOST", label: "Lost" },
];

export default function CrmLeadsPage() {
  const go = useGo();
  const can = useCan();
  const canManage = can("crm.leads.manage");

  const { leads, tasks } = useCrmStore();

  // View mode
  const [viewMode, setViewMode] = useState<"board" | "list">("board");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [interestFilter, setInterestFilter] = useState<string>("ALL");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // New Lead Modal
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Drag and Drop state
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);

  // ReasonDialog for moving to LOST
  const [lostDialogLead, setLostDialogLead] = useState<Lead | null>(null);

  // Bulk actions in List view
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkOwner, setBulkOwner] = useState<string>(CRM_OWNERS[0].name);

  // Setup DnD sensors (requires 4px movement before drag initiates to allow clicking)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    })
  );

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesEmail = lead.email.toLowerCase().includes(q);
        const matchesPhone = lead.phone.toLowerCase().includes(q);
        const matchesCompany = lead.companyName?.toLowerCase().includes(q) || false;
        const matchesInterest = lead.interest.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCompany && !matchesInterest) {
          return false;
        }
      }

      // Owner filter
      if (ownerFilter !== "ALL" && lead.owner !== ownerFilter) return false;

      // Source filter
      if (sourceFilter !== "ALL" && lead.source !== sourceFilter) return false;

      // Interest filter
      if (interestFilter !== "ALL" && !lead.interest.toLowerCase().includes(interestFilter.toLowerCase())) {
        return false;
      }

      // Overdue filter
      if (overdueOnly && !isLeadOverdue(lead, tasks)) return false;

      return true;
    });
  }, [leads, tasks, searchQuery, ownerFilter, sourceFilter, interestFilter, overdueOnly]);

  // Handle Drag Start
  const handleDragStart = (event: DragStartEvent) => {
    if (!canManage) return;
    const lead = leads.find((l) => l.id === event.active.id);
    if (lead) setActiveDragLead(lead);
  };

  // Handle Drag End
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragLead(null);
    if (!canManage) {
      toast({
        type: "error",
        title: "Permission Required",
        message: "CRM group permission required to drag and change lead stages.",
      });
      return;
    }

    const { active, over } = event;
    if (!over) return;

    const leadId = active.id as string;
    const targetStage = over.id as LeadStage;

    const currentLead = leads.find((l) => l.id === leadId);
    if (!currentLead || currentLead.stage === targetStage) return;

    // If dropping on LOST, require ReasonDialog
    if (targetStage === "LOST") {
      setLostDialogLead(currentLead);
      return;
    }

    // Otherwise, perform optimistic update with undo toast
    const prevStage = currentLead.stage;
    crmActions.updateLeadStage(leadId, targetStage);

    toast({
      type: "success",
      title: "Stage Updated",
      message: `${currentLead.name} moved to ${targetStage.replace("_", " ")}.`,
    });
  };

  // Confirm LOST with mandatory reason
  const handleConfirmLost = (reason: string) => {
    if (!lostDialogLead) return;
    crmActions.updateLeadStage(lostDialogLead.id, "LOST", reason);
    setLostDialogLead(null);
  };

  // Bulk assign owner handler
  const handleBulkAssign = () => {
    if (selectedLeadIds.length === 0) return;
    crmActions.bulkAssignOwner(selectedLeadIds, bulkOwner);
    setSelectedLeadIds([]);
  };

  // Toggle selection for all filtered leads in list view
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <PageHeader
        title="Prospect & Member Leads"
        description="Track all customer enquiries, club walkthroughs, trial sessions, and quotation pipelines."
        actions={
          <div className="flex items-center gap-3">
            {/* Board / List Toggle */}
            <div className="flex items-center bg-white/8 rounded-full p-1 border border-white/14">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "board" ? "bg-volt-400 text-ink-900 shadow-sm" : "text-white/70 hover:text-white"
                }`}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>Board</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === "list" ? "bg-volt-400 text-ink-900 shadow-sm" : "text-white/70 hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>

            {/* + New Lead Button */}
            <Button variant="primary" size="sm" onClick={() => setIsNewLeadOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              New Lead
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="rounded-2xl border border-white/10 bg-court-600/70 p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, phone, email, interest..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-white/8 border border-white/14 text-xs text-white placeholder-white/40 focus:border-volt-400 focus:ring-2 focus:ring-volt-400/25 outline-none"
            />
          </div>

          {/* Owner Filter */}
          <Select
            value={ownerFilter}
            onChange={(val) => setOwnerFilter(val)}
            options={[
              { value: "ALL", label: "All Sales Owners" },
              ...CRM_OWNERS.map((o) => ({ value: o.name, label: o.name })),
            ]}
          />

          {/* Source Filter */}
          <Select
            value={sourceFilter}
            onChange={(val) => setSourceFilter(val)}
            options={[
              { value: "ALL", label: "All Lead Sources" },
              { value: "WEBSITE", label: "Website Form" },
              { value: "TRIAL", label: "Trial Booking" },
              { value: "WALK_IN", label: "Walk-in Enquiry" },
              { value: "PHONE", label: "Phone Call" },
              { value: "REFERRAL", label: "Member Referral" },
            ]}
          />

          {/* Interest Filter */}
          <Select
            value={interestFilter}
            onChange={(val) => setInterestFilter(val)}
            options={[
              { value: "ALL", label: "All Sports & Plans" },
              { value: "Tennis", label: "Tennis" },
              { value: "Padel", label: "Padel" },
              { value: "Badminton", label: "Badminton" },
              { value: "Gold", label: "Gold Plan" },
              { value: "Corporate", label: "Corporate Package" },
              { value: "Junior", label: "Junior Academy" },
            ]}
          />

          {/* Overdue Only Toggle */}
          <button
            type="button"
            onClick={() => setOverdueOnly(!overdueOnly)}
            className={`h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              overdueOnly
                ? "bg-red-500/20 text-red-300 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                : "bg-white/8 text-white/70 border-white/14 hover:border-white/30"
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${overdueOnly ? "text-red-400" : "text-white/40"}`} />
            <span>Overdue Follow-ups Only</span>
          </button>
        </div>

        {/* Results Count & Permission indicator */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/8 text-xs text-white/50">
          <div>
            Showing <strong>{filteredLeads.length}</strong> of <strong>{leads.length}</strong> leads
            {overdueOnly && <span className="text-red-400 font-medium ml-1.5">(Filtered for overdue follow-ups)</span>}
          </div>

          {!canManage && (
            <div className="flex items-center gap-1.5 text-amber-300/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <Lock className="w-3 h-3 text-amber-400" />
              <span>Front Desk mode: read & follow-up access. Stage dragging requires CRM group.</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Board or List */}
      {viewMode === "board" ? (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="overflow-x-auto pb-4 pt-1">
            <div className="flex gap-4 min-w-max">
              {STAGES.map((st) => (
                <LeadKanbanColumn
                  key={st.key}
                  stage={st.key}
                  label={st.label}
                  leads={filteredLeads.filter((l) => l.stage === st.key)}
                  tasks={tasks}
                />
              ))}
            </div>
          </div>

          {/* Drag Overlay for smooth visual card lift */}
          <DragOverlay>
            {activeDragLead ? <LeadCard lead={activeDragLead} tasks={tasks} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      ) : (
        /* List View */
        <div className="space-y-4">
          {/* Bulk Action Bar (when rows selected) */}
          {selectedLeadIds.length > 0 && canManage && (
            <div className="rounded-2xl bg-volt-400/10 border border-volt-400/30 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-volt-300">
                {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? "s" : ""} selected
              </span>

              <div className="flex items-center gap-2">
                <span className="text-white/70">Reassign to:</span>
                <select
                  value={bulkOwner}
                  onChange={(e) => setBulkOwner(e.target.value)}
                  className="bg-navy-900 border border-white/20 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none"
                >
                  {CRM_OWNERS.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name}
                    </option>
                  ))}
                </select>
                <Button variant="primary" size="sm" onClick={handleBulkAssign}>
                  Apply Bulk Assignment
                </Button>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="rounded-2xl border border-white/10 bg-court-600/70 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-court-700 text-white/70 uppercase tracking-wider text-[11px]">
                    {canManage && (
                      <th className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                          onChange={toggleSelectAll}
                          className="rounded border-white/30 text-volt-400 focus:ring-0"
                        />
                      </th>
                    )}
                    <th className="py-3 px-3">Lead / Prospect</th>
                    <th className="py-3 px-3">Stage</th>
                    <th className="py-3 px-3">Interest / Plan</th>
                    <th className="py-3 px-3">Source</th>
                    <th className="py-3 px-3">Assigned Owner</th>
                    <th className="py-3 px-3">Next Follow-up</th>
                    <th className="py-3 px-3 text-right">Value (₹)</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8 text-white">
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const overdue = isLeadOverdue(lead, tasks);

                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-white/4 transition-colors cursor-pointer ${
                          isSelected ? "bg-volt-400/5" : ""
                        }`}
                        onClick={() => go(`/crm/leads/${lead.id}`)}
                      >
                        {canManage && (
                          <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedLeadIds((prev) =>
                                  prev.includes(lead.id)
                                    ? prev.filter((id) => id !== lead.id)
                                    : [...prev, lead.id]
                                );
                              }}
                              className="rounded border-white/30 text-volt-400 focus:ring-0"
                            />
                          </td>
                        )}

                        <td className="py-3.5 px-3">
                          <div>
                            <p className="font-semibold text-white hover:text-volt-400 transition-colors">
                              {lead.name}
                            </p>
                            <p className="text-[11px] text-white/50">{lead.phone}</p>
                            {lead.companyName && (
                              <p className="text-[10px] text-white/40 flex items-center gap-1 mt-0.5">
                                <Building className="w-2.5 h-2.5" />
                                {lead.companyName}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                              lead.stage === "NEW"
                                ? "bg-sky-500/20 text-sky-300 border-sky-500/40"
                                : lead.stage === "CONTACTED"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                : lead.stage === "QUOTE_SENT"
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                                : lead.stage === "TRIAL_BOOKED"
                                ? "bg-volt-400/20 text-volt-300 border-volt-400/40"
                                : lead.stage === "WON"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                            }`}
                          >
                            {lead.stage.replace("_", " ")}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-medium text-white/90">{lead.interest}</span>
                        </td>

                        <td className="py-3.5 px-3 capitalize text-white/70">
                          {lead.source.toLowerCase().replace("_", " ")}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-volt-400/20 text-volt-400 font-bold text-[9px] flex items-center justify-center">
                              {lead.ownerAvatar || lead.owner.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white/80">{lead.owner}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {overdue ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30 animate-pulse">
                              <AlertTriangle className="w-3 h-3" />
                              ⏰ Overdue
                            </span>
                          ) : lead.nextFollowUp ? (
                            <span className="text-white/60">
                              {new Date(lead.nextFollowUp).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          ) : (
                            <span className="text-white/30">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-volt-400">
                          <Money amount={lead.estimatedValue} />
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              go(`/crm/leads/${lead.id}`);
                            }}
                            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-volt-400 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Modal */}
      <NewLeadModal
        isOpen={isNewLeadOpen}
        onClose={() => setIsNewLeadOpen(false)}
        onSuccess={(id) => go(`/crm/leads/${id}`)}
      />

      {/* ReasonDialog for marking Lead as LOST */}
      <ReasonDialog
        isOpen={!!lostDialogLead}
        onClose={() => setLostDialogLead(null)}
        onConfirm={handleConfirmLost}
        title="Mark Lead as Lost"
        description={`Specify the reason why ${lostDialogLead?.name} could not be converted (e.g. Budget, joined competitor, distance).`}
        actionLabel="Mark Lost"
        variant="danger"
      />
    </div>
  );
}
