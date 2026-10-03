import { useState } from "react";
import { useGo } from "@/app/router/links";
import { useCan } from "@/lib/permissions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ReasonDialog } from "@/components/shared/ReasonDialog";
import { Money } from "@/components/shared/Money";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Building,
  Calendar,
  Sparkles,
  FileSignature,
  UserCheck,
  Briefcase,
  XCircle,
  Lock,
  Globe,
  Footprints,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useCrmLead, crmActions, isLeadOverdue } from "../crmStore";
import { CRM_OWNERS } from "../sampleData";
import { LeadActivityTimeline } from "../components/LeadActivityTimeline";
import { LeadFollowUps } from "../components/LeadFollowUps";
import { LeadQuotesList } from "../components/LeadQuotesList";
import { CorporateClientModal } from "../components/CorporateClientModal";
import type { LeadStage } from "../types";

export default function CrmLeadDetailPage({ params }: { params?: Record<string, string> }) {
  const go = useGo();
  const can = useCan();

  // Granular CRM permissions
  const canManage = can("crm.leads.manage");
  const canQuote = can("crm.quotes");
  const canConvert = can("crm.convert");

  // Extract ID from params or URL path
  const pathParts = typeof window !== "undefined" ? window.location.pathname.split("/") : [];
  const rawId = params?.["id"] || pathParts[pathParts.indexOf("leads") + 1] || "lead-001";
  // Filter out sub-route if any
  const id = rawId.includes("quote") ? pathParts[pathParts.indexOf("leads") + 1] : rawId;

  const { lead, activities, tasks, quotes } = useCrmLead(id);

  // Reason dialog for marking LOST
  const [isLostDialogOpen, setIsLostDialogOpen] = useState(false);

  // Corporate conversion modal
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);

  if (!lead) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Lead Not Found</h2>
        <p className="text-white/60 text-sm">The requested enquiry or lead does not exist in the CRM system.</p>
        <Button variant="primary" onClick={() => go("/crm/leads")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lead Board
        </Button>
      </div>
    );
  }

  const overdue = isLeadOverdue(lead, tasks);

  // Handle stage change from dropdown
  const handleStageSelect = (newStage: LeadStage) => {
    if (!canManage) return;
    if (newStage === "LOST") {
      setIsLostDialogOpen(true);
      return;
    }
    crmActions.updateLeadStage(lead.id, newStage);
  };

  // Convert to Member action
  const handleConvertToMember = () => {
    if (!canConvert) return;
    // Mark as WON in CRM store
    crmActions.convertLeadToMember(lead.id);

    // Pre-fill parameters for desk register page
    const query = new URLSearchParams({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      leadId: lead.id,
    }).toString();

    go(`/desk/register?${query}`);
  };

  const getSourceIcon = () => {
    switch (lead.source) {
      case "WEBSITE":
        return <Globe className="w-3.5 h-3.5 text-blue-400" />;
      case "TRIAL":
        return <Sparkles className="w-3.5 h-3.5 text-volt-400" />;
      case "WALK_IN":
        return <Footprints className="w-3.5 h-3.5 text-emerald-400" />;
      case "PHONE":
        return <Phone className="w-3.5 h-3.5 text-amber-400" />;
      case "REFERRAL":
        return <Users className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => go("/crm/leads")}
          className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Lead Board</span>
        </button>
      </div>

      {/* Header Bar */}
      <div className="rounded-2xl border border-white/14 bg-court-600/70 p-6 shadow-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight font-display">{lead.name}</h1>
              {lead.companyName && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/14">
                  <Building className="w-3 h-3 text-white/50" />
                  {lead.companyName}
                </span>
              )}
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs bg-court-700 text-white/70 border border-white/10 capitalize">
                {getSourceIcon()}
                {lead.source.toLowerCase().replace("_", " ")}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-white/70">
              <span className="flex items-center gap-1.5 hover:text-white">
                <Phone className="w-3.5 h-3.5 text-white/40" />
                <a href={`tel:${lead.phone}`}>{lead.phone}</a>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 hover:text-white">
                <Mail className="w-3.5 h-3.5 text-white/40" />
                <a href={`mailto:${lead.email}`}>{lead.email}</a>
              </span>
              <span>•</span>
              <span className="text-volt-300 font-medium">Interest: {lead.interest}</span>
            </div>
          </div>

          {/* Header Controls: Stage, Owner, Value */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Stage Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Stage</span>
              {canManage ? (
                <select
                  value={lead.stage}
                  onChange={(e) => handleStageSelect(e.target.value as LeadStage)}
                  className="bg-court-700 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-volt-400 outline-none cursor-pointer"
                >
                  <option value="NEW">New Enquiry</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="TRIAL_BOOKED">Trial Booked</option>
                  <option value="QUOTE_SENT">Quote Sent</option>
                  <option value="WON">Won / Member</option>
                  <option value="LOST">Lost</option>
                </select>
              ) : (
                <div
                  className="px-3 py-1.5 rounded-xl bg-court-700 border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 cursor-not-allowed"
                  title="CRM group required to change stage"
                >
                  <span>{lead.stage.replace("_", " ")}</span>
                  <Lock className="w-3 h-3 text-white/40" />
                </div>
              )}
            </div>

            {/* Owner Selector */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Assigned Owner</span>
              {canManage ? (
                <select
                  value={lead.owner}
                  onChange={(e) => crmActions.assignLeadOwner(lead.id, e.target.value)}
                  className="bg-court-700 border border-white/20 text-white rounded-xl px-3 py-1.5 text-xs font-semibold focus:border-volt-400 outline-none cursor-pointer"
                >
                  {CRM_OWNERS.map((o) => (
                    <option key={o.name} value={o.name}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div
                  className="px-3 py-1.5 rounded-xl bg-court-700 border border-white/10 text-xs font-semibold text-white/80 flex items-center gap-1.5 cursor-not-allowed"
                  title="CRM group required to reassign owner"
                >
                  <span>{lead.owner}</span>
                  <Lock className="w-3 h-3 text-white/40" />
                </div>
              )}
            </div>

            {/* Pipeline Value */}
            <div className="flex flex-col gap-1 sm:text-right">
              <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider">Estimated Value</span>
              <span className="text-base font-bold text-volt-400 font-mono">
                <Money amount={lead.estimatedValue} />
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {lead.stage === "WON" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Lead Closed Won {lead.convertedMemberId ? `(${lead.convertedMemberId})` : ""}
              </span>
            ) : lead.stage === "LOST" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <XCircle className="w-3.5 h-3.5" />
                Lead Closed Lost ({lead.lostReason || "No reason specified"})
              </span>
            ) : (
              <span className="text-xs text-white/50">
                Enquiry received {new Date(lead.createdAt).toLocaleDateString("en-IN")}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Generate Quote */}
            {canQuote ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => go(`/crm/leads/${lead.id}/quote`)}
              >
                <FileSignature className="w-3.5 h-3.5 mr-1.5" />
                Generate Quote
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled title="CRM group required">
                <Lock className="w-3 h-3 mr-1.5 opacity-50" />
                Generate Quote
              </Button>
            )}

            {/* Convert to Member */}
            {canConvert ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConvertToMember}
                disabled={lead.stage === "WON"}
              >
                <UserCheck className="w-3.5 h-3.5 mr-1.5" />
                Convert to Member
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled title="CRM group required">
                <Lock className="w-3 h-3 mr-1.5 opacity-50" />
                Convert to Member
              </Button>
            )}

            {/* Convert to Business Client */}
            {canConvert ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCorporateModalOpen(true)}
                disabled={lead.stage === "WON"}
              >
                <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                Business Client
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled title="CRM group required">
                <Lock className="w-3 h-3 mr-1.5 opacity-50" />
                Business Client
              </Button>
            )}

            {/* Mark LOST */}
            {canManage ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsLostDialogOpen(true)}
                disabled={lead.stage === "LOST"}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Mark Lost
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Grid: 7 Cols Left (Activity Timeline + Composer), 5 Cols Right (Follow-ups + Quotes + Trial) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Timeline & Notes */}
        <div className="lg:col-span-7 space-y-6">
          <LeadActivityTimeline leadId={lead.id} activities={activities} />
        </div>

        {/* Right (5 cols): Follow-up tasks & Quotes list & Linked trial */}
        <div className="lg:col-span-5 space-y-6">
          {/* Follow-up tasks */}
          <LeadFollowUps leadId={lead.id} tasks={tasks} />

          {/* Quotes list */}
          <LeadQuotesList leadId={lead.id} quotes={quotes} />

          {/* Linked Trial Booking Card (if trial booking exists) */}
          {(lead.trialBookingRef || lead.source === "TRIAL") && (
            <div className="rounded-2xl border border-volt-400/30 bg-court-600/70 p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-volt-400" />
                  <h3 className="text-sm font-semibold text-white">Linked Trial Booking</h3>
                </div>
                <span className="font-mono text-xs text-volt-300 font-semibold">
                  {lead.trialBookingRef || "TRL-2026-ACTIVE"}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-white/80">
                <div className="flex justify-between">
                  <span className="text-white/50">Sport / Session:</span>
                  <span className="font-medium text-white">{lead.interest}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Court Reservation:</span>
                  <span className="font-medium text-white">Court 1 (Championship)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Status:</span>
                  <span className="text-emerald-400 font-semibold">Confirmed / Hold Validated</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ReasonDialog for LOST */}
      <ReasonDialog
        isOpen={isLostDialogOpen}
        onClose={() => setIsLostDialogOpen(false)}
        onConfirm={(reason) => {
          crmActions.updateLeadStage(lead.id, "LOST", reason);
          setIsLostDialogOpen(false);
        }}
        title="Mark Lead as Lost"
        description={`Specify mandatory reason why ${lead.name} was marked lost.`}
        actionLabel="Confirm Lost"
        variant="danger"
      />

      {/* Corporate Client Modal */}
      <CorporateClientModal
        isOpen={isCorporateModalOpen}
        onClose={() => setIsCorporateModalOpen(false)}
        lead={lead}
      />
    </div>
  );
}
