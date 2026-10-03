// CRM Store using useSyncExternalStore for reactive client-side CRM state

import { useSyncExternalStore, useMemo } from "react";
import type {
  Lead,
  LeadStage,
  LeadActivity,
  FollowUpTask,
  Quote,
  Campaign,
  CorporateClientPayload,
} from "./types";
import {
  INITIAL_LEADS,
  INITIAL_ACTIVITIES,
  INITIAL_TASKS,
  INITIAL_QUOTES,
  INITIAL_CAMPAIGNS,
} from "./sampleData";
import { toast } from "@/components/ui/Toast";

interface CrmState {
  leads: Lead[];
  activities: LeadActivity[];
  tasks: FollowUpTask[];
  quotes: Quote[];
  campaigns: Campaign[];
}

// Global state in memory
let state: CrmState = {
  leads: INITIAL_LEADS,
  activities: INITIAL_ACTIVITIES,
  tasks: INITIAL_TASKS,
  quotes: INITIAL_QUOTES,
  campaigns: INITIAL_CAMPAIGNS,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): CrmState {
  return state;
}

export function isTaskOverdue(task: FollowUpTask): boolean {
  if (task.completed) return false;
  try {
    const dueTime = new Date(task.dueAt).getTime();
    return !isNaN(dueTime) && dueTime < Date.now();
  } catch {
    return false;
  }
}

export function isLeadOverdue(lead: Lead, tasks: FollowUpTask[]): boolean {
  const leadTasks = tasks.filter((t) => t.leadId === lead.id && !t.completed);
  if (leadTasks.some((t) => isTaskOverdue(t))) return true;
  if (lead.nextFollowUp) {
    try {
      const dueTime = new Date(lead.nextFollowUp).getTime();
      return !isNaN(dueTime) && dueTime < Date.now() && lead.stage !== "WON" && lead.stage !== "LOST";
    } catch {
      return false;
    }
  }
  return false;
}

export const crmActions = {
  /** Add a new lead (used by Front Desk walk-in/phone or CRM) */
  addLead: (payload: {
    name: string;
    phone: string;
    email: string;
    stage?: LeadStage;
    source: Lead["source"];
    interest: string;
    owner?: string;
    estimatedValue?: number;
    notes?: string;
    nextFollowUp?: string;
    companyName?: string;
  }): Lead => {
    const leadId = `lead-${Date.now().toString(36)}`;
    const newLead: Lead = {
      id: leadId,
      name: payload.name,
      phone: payload.phone,
      email: payload.email,
      stage: payload.stage || "NEW",
      source: payload.source,
      interest: payload.interest,
      owner: payload.owner || "Aarav Mehta",
      ownerAvatar: (payload.owner || "Aarav Mehta").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
      estimatedValue: payload.estimatedValue ?? 25000,
      createdAt: new Date().toISOString(),
      notes: payload.notes,
      nextFollowUp: payload.nextFollowUp,
      companyName: payload.companyName,
    };

    const initialActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "NOTE",
      author: payload.owner || "Staff",
      title: "Lead Created",
      content: payload.notes || `New enquiry received via ${payload.source.toLowerCase()}.`,
      createdAt: new Date().toISOString(),
    };

    let newTasks = state.tasks;
    if (payload.nextFollowUp) {
      newTasks = [
        ...state.tasks,
        {
          id: `task-${Date.now()}`,
          leadId,
          title: `Initial follow-up with ${payload.name}`,
          dueAt: payload.nextFollowUp,
          completed: false,
          assignedTo: payload.owner || "Aarav Mehta",
          notes: payload.notes,
        },
      ];
    }

    state = {
      ...state,
      leads: [newLead, ...state.leads],
      activities: [initialActivity, ...state.activities],
      tasks: newTasks,
    };
    notify();

    import("@/services/api/crmApi").then(({ crmApi }) => {
      crmApi
        .createLead({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          source: payload.source,
          sportInterest: payload.interest,
          estimatedValue: payload.estimatedValue,
          notes: payload.notes,
        })
        .catch(() => {});
    });

    toast({
      type: "info",
      title: "Lead Created",
      message: `New lead: ${newLead.name} (${newLead.interest})`,
    });

    return newLead;
  },

  /** Update stage of lead (with optimistic update, undo support, and reason for LOST) */
  updateLeadStage: (
    leadId: string,
    newStage: LeadStage,
    lostReason?: string,
    author = "Current Staff"
  ): { previousStage: LeadStage } | null => {
    const target = state.leads.find((l) => l.id === leadId);
    if (!target) return null;
    const previousStage = target.stage;
    if (previousStage === newStage) return { previousStage };

    const updatedLead: Lead = {
      ...target,
      stage: newStage,
      lostReason: newStage === "LOST" ? lostReason || target.lostReason : undefined,
    };

    const stageActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: newStage === "LOST" ? "LOST" : newStage === "WON" ? "CONVERTED" : "STAGE_CHANGE",
      author,
      title: newStage === "LOST" ? "Lead Marked LOST" : `Stage Changed to ${newStage.replace("_", " ")}`,
      content:
        newStage === "LOST"
          ? `Reason: ${lostReason || "No specific reason provided."}`
          : `Lead moved from ${previousStage} to ${newStage}.`,
      createdAt: new Date().toISOString(),
      metadata: { previousStage, newStage, lostReason },
    };

    state = {
      ...state,
      leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      activities: [stageActivity, ...state.activities],
    };
    notify();

    import("@/services/api/crmApi").then(({ crmApi }) => {
      crmApi.updateLeadStage(leadId, newStage, lostReason).catch(() => {});
    });

    return { previousStage };
  },

  /** Revert stage (used by Undo toast) */
  revertLeadStage: (leadId: string, previousStage: LeadStage) => {
    state = {
      ...state,
      leads: state.leads.map((l) => (l.id === leadId ? { ...l, stage: previousStage } : l)),
    };
    notify();
    toast({
      type: "info",
      title: "Action Undone",
      message: `Lead returned to ${previousStage}.`,
    });
  },

  /** Assign owner to lead */
  assignLeadOwner: (leadId: string, ownerName: string, author = "Current Staff") => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const initials = ownerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const updated: Lead = { ...lead, owner: ownerName, ownerAvatar: initials };

    const activity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "NOTE",
      author,
      title: "Owner Reassigned",
      content: `Lead reassigned from ${lead.owner} to ${ownerName}.`,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      leads: state.leads.map((l) => (l.id === leadId ? updated : l)),
      activities: [activity, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Owner Assigned",
      message: `${lead.name} assigned to ${ownerName}.`,
    });
  },

  /** Bulk assign owner to multiple leads */
  bulkAssignOwner: (leadIds: string[], ownerName: string, author = "Current Staff") => {
    const initials = ownerName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const now = new Date().toISOString();
    const newActivities: LeadActivity[] = leadIds.map((id) => ({
      id: `act-${Date.now()}-${id}`,
      leadId: id,
      type: "NOTE",
      author,
      title: "Owner Assigned",
      content: `Lead assigned to ${ownerName} via bulk action.`,
      createdAt: now,
    }));

    state = {
      ...state,
      leads: state.leads.map((l) =>
        leadIds.includes(l.id) ? { ...l, owner: ownerName, ownerAvatar: initials } : l
      ),
      activities: [...newActivities, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Bulk Assignment Completed",
      message: `${leadIds.length} leads assigned to ${ownerName}.`,
    });
  },

  /** Add activity entry (Call, Email, Note) */
  addActivity: (
    leadId: string,
    activity: {
      type: "NOTE" | "CALL" | "EMAIL";
      title: string;
      content: string;
      author: string;
      authorRole?: string;
    }
  ) => {
    const newAct: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: activity.type,
      author: activity.author,
      authorRole: activity.authorRole,
      title: activity.title,
      content: activity.content,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      activities: [newAct, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Activity Logged",
      message: `${activity.type} recorded for lead.`,
    });
  },

  /** Add follow-up task */
  addFollowUp: (
    leadId: string,
    task: {
      title: string;
      dueAt: string;
      assignedTo: string;
      notes?: string;
    }
  ) => {
    const newTask: FollowUpTask = {
      id: `task-${Date.now()}`,
      leadId,
      title: task.title,
      dueAt: task.dueAt,
      completed: false,
      assignedTo: task.assignedTo,
      notes: task.notes,
    };

    state = {
      ...state,
      tasks: [newTask, ...state.tasks],
      leads: state.leads.map((l) =>
        l.id === leadId ? { ...l, nextFollowUp: task.dueAt } : l
      ),
    };
    notify();

    toast({
      type: "success",
      title: "Follow-up Scheduled",
      message: `Task due on ${new Date(task.dueAt).toLocaleDateString("en-IN")}`,
    });
  },

  /** Toggle follow-up task completion */
  toggleFollowUp: (taskId: string, author = "Current Staff") => {
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;

    const nextCompleted = !target.completed;
    const updatedTask: FollowUpTask = {
      ...target,
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
    };

    const taskActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: target.leadId,
      type: "NOTE",
      author,
      title: nextCompleted ? "Task Completed" : "Task Reopened",
      content: `Follow-up task "${target.title}" was marked ${nextCompleted ? "complete" : "pending"}.`,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      activities: [taskActivity, ...state.activities],
    };
    notify();

    toast({
      type: nextCompleted ? "success" : "info",
      title: nextCompleted ? "Task Completed" : "Task Reopened",
      message: target.title,
    });
  },

  /** Create a quote */
  createQuote: (
    payload: Omit<Quote, "id" | "quoteNumber" | "createdAt" | "status"> & {
      status?: Quote["status"];
    },
    author = "Current Staff"
  ): Quote => {
    const quoteCount = state.quotes.length + 1;
    const quoteNumber = `QTE-2026-${String(quoteCount).padStart(3, "0")}`;
    const quoteId = `qte-${Date.now()}`;

    const newQuote: Quote = {
      ...payload,
      id: quoteId,
      quoteNumber,
      status: payload.status || "DRAFT",
      createdAt: new Date().toISOString(),
    };

    const quoteActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: payload.leadId,
      type: "QUOTE_CREATED",
      author,
      title: `Quote ${quoteNumber} Created`,
      content: `Quotation for ₹${payload.grandTotal.toLocaleString("en-IN")} drafted (${payload.quoteType}).`,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      quotes: [newQuote, ...state.quotes],
      leads: state.leads.map((l) =>
        l.id === payload.leadId ? { ...l, estimatedValue: payload.grandTotal } : l
      ),
      activities: [quoteActivity, ...state.activities],
    };
    notify();

    import("@/services/api/crmApi").then(({ crmApi }) => {
      crmApi
        .createQuote({
          leadId: payload.leadId,
          validDays: 14,
          notes: payload.terms,
          lines: payload.items.map((i) => ({
            description: i.description,
            quantity: i.qty,
            unitPrice: i.rate,
            taxPercent: i.gstPercent,
          })),
        })
        .catch(() => {});
    });

    toast({
      type: "success",
      title: "Quote Saved",
      message: `${quoteNumber} saved as draft.`,
    });

    return newQuote;
  },

  /** Send quote via email */
  sendQuote: (quoteId: string, author = "Current Staff") => {
    const quote = state.quotes.find((q) => q.id === quoteId);
    if (!quote) return;

    const updatedQuote: Quote = {
      ...quote,
      status: "SENT",
      sentAt: new Date().toISOString(),
    };

    const lead = state.leads.find((l) => l.id === quote.leadId);

    const quoteActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId: quote.leadId,
      type: "QUOTE_SENT",
      author,
      title: `Quote ${quote.quoteNumber} Dispatched`,
      content: `Sent quotation via email to ${lead?.email || "customer"} with PDF invoice breakdown attached.`,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      quotes: state.quotes.map((q) => (q.id === quoteId ? updatedQuote : q)),
      leads: state.leads.map((l) =>
        l.id === quote.leadId ? { ...l, stage: "QUOTE_SENT", estimatedValue: quote.grandTotal } : l
      ),
      activities: [quoteActivity, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Quote Dispatched",
      message: `${quote.quoteNumber} emailed with PDF attachment. Lead stage set to QUOTE SENT.`,
    });
  },

  /** Convert lead to Member (navigates to /desk/register prefilled and marks lead WON) */
  convertLeadToMember: (leadId: string, memberId = `MEM-2026-${Math.floor(100 + Math.random() * 900)}`, author = "Current Staff") => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const updatedLead: Lead = {
      ...lead,
      stage: "WON",
      convertedMemberId: memberId,
    };

    const convertActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "CONVERTED",
      author,
      title: "Converted to Member",
      content: `Lead signed up and converted to Member #${memberId}.`,
      createdAt: new Date().toISOString(),
    };

    state = {
      ...state,
      leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      activities: [convertActivity, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Lead Converted!",
      message: `${lead.name} has been enrolled as Member #${memberId}. Marked as WON.`,
    });
  },

  /** Convert lead to Corporate Business Client */
  convertLeadToBusinessClient: (leadId: string, payload: CorporateClientPayload, author = "Current Staff") => {
    const lead = state.leads.find((l) => l.id === leadId);
    if (!lead) return;

    const clientId = `CORP-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedLead: Lead = {
      ...lead,
      stage: "WON",
      companyName: payload.companyName,
    };

    const convertActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      leadId,
      type: "CONVERTED",
      author,
      title: `Converted to Business Client #${clientId}`,
      content: `Corporate agreement setup for ${payload.companyName}. GSTIN: ${payload.gstin}. Rate Plan: ${payload.ratePlan}.`,
      createdAt: new Date().toISOString(),
      metadata: payload,
    };

    state = {
      ...state,
      leads: state.leads.map((l) => (l.id === leadId ? updatedLead : l)),
      activities: [convertActivity, ...state.activities],
    };
    notify();

    toast({
      type: "success",
      title: "Corporate Client Created",
      message: `${payload.companyName} registered under ${clientId}. Lead marked WON.`,
    });
  },

  /** Create marketing campaign */
  createCampaign: (campaign: Omit<Campaign, "id" | "createdAt" | "status" | "recipientCount" | "openCount" | "clickCount" | "conversionCount">): Campaign => {
    const newCamp: Campaign = {
      ...campaign,
      id: `camp-${Date.now()}`,
      status: "DRAFT",
      createdAt: new Date().toISOString(),
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
      conversionCount: 0,
    };

    state = {
      ...state,
      campaigns: [newCamp, ...state.campaigns],
    };
    notify();

    toast({
      type: "success",
      title: "Campaign Saved",
      message: `"${newCamp.title}" saved as draft.`,
    });

    return newCamp;
  },

  /** Send campaign now */
  sendCampaign: (campaignId: string) => {
    const camp = state.campaigns.find((c) => c.id === campaignId);
    if (!camp) return;

    // Simulate recipients based on criteria
    const recipientEstimate = Math.floor(60 + Math.random() * 150);
    const openEstimate = Math.floor(recipientEstimate * 0.65);
    const clickEstimate = Math.floor(openEstimate * 0.45);
    const convEstimate = Math.floor(clickEstimate * 0.25);

    const updated: Campaign = {
      ...camp,
      status: "SENT",
      sentAt: new Date().toISOString(),
      recipientCount: recipientEstimate,
      openCount: openEstimate,
      clickCount: clickEstimate,
      conversionCount: convEstimate,
    };

    state = {
      ...state,
      campaigns: state.campaigns.map((c) => (c.id === campaignId ? updated : c)),
    };
    notify();

    toast({
      type: "success",
      title: "Campaign Dispatched 🚀",
      message: `"${camp.title}" dispatched to ${recipientEstimate} recipients via ${camp.channel}.`,
    });
  },
};

// ─── Reactive Hooks ─────────────────────────────────────────────────────────

export function useCrmStore() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function useCrmLeads() {
  const { leads, tasks } = useCrmStore();
  return useMemo(() => {
    return {
      leads,
      overdueCount: leads.filter((l) => isLeadOverdue(l, tasks)).length,
      wonCount: leads.filter((l) => l.stage === "WON").length,
      pipelineValue: leads.filter((l) => l.stage !== "WON" && l.stage !== "LOST").reduce((sum, l) => sum + l.estimatedValue, 0),
      wonRevenue: leads.filter((l) => l.stage === "WON").reduce((sum, l) => sum + l.estimatedValue, 0),
    };
  }, [leads, tasks]);
}

export function useCrmLead(leadId: string | undefined) {
  const { leads, activities, tasks, quotes } = useCrmStore();
  return useMemo(() => {
    if (!leadId) return { lead: null, activities: [], tasks: [], quotes: [] };
    const lead = leads.find((l) => l.id === leadId) || null;
    const leadActivities = activities.filter((a) => a.leadId === leadId);
    const leadTasks = tasks.filter((t) => t.leadId === leadId);
    const leadQuotes = quotes.filter((q) => q.leadId === leadId);
    return { lead, activities: leadActivities, tasks: leadTasks, quotes: leadQuotes };
  }, [leads, activities, tasks, quotes, leadId]);
}

export function useCrmQuotes(leadId?: string) {
  const { quotes } = useCrmStore();
  return useMemo(() => {
    return leadId ? quotes.filter((q) => q.leadId === leadId) : quotes;
  }, [quotes, leadId]);
}

export function useCrmCampaigns() {
  const { campaigns } = useCrmStore();
  return campaigns;
}
