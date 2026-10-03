// Client-side store for Website leads, local form drafts, and public booking states

import { useSyncExternalStore, useMemo } from "react";
import { CRMLead, TrialBookingPayload, ContactEnquiryPayload } from "./types";
import { INITIAL_CRM_LEADS } from "./sampleData";

interface WebsiteState {
  leads: CRMLead[];
  contactDraft: Partial<ContactEnquiryPayload>;
}

let state: WebsiteState = {
  leads: INITIAL_CRM_LEADS,
  contactDraft: {},
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

function getSnapshot(): WebsiteState {
  return state;
}

export const websiteActions = {
  addTrialLead: (payload: TrialBookingPayload): { success: boolean; bookingRef: string; leadId: string } => {
    const bookingRef = `TRL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const leadId = `LEAD-${Date.now().toString(36).toUpperCase()}`;

    const newLead: CRMLead = {
      id: leadId,
      source: "TRIAL_BOOKING",
      name: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      interest: `${payload.sport.toUpperCase()} Trial Session (${payload.skillLevel})`,
      status: "TRIAL_SCHEDULED",
      createdAt: new Date().toISOString(),
      details: {
        bookingRef,
        sport: payload.sport,
        date: payload.date,
        timeSlot: payload.timeSlot,
        paymentMethod: payload.paymentMethod,
        notes: payload.notes,
      },
    };

    state = {
      ...state,
      leads: [newLead, ...state.leads],
    };
    notify();

    return { success: true, bookingRef, leadId };
  },

  addContactEnquiry: (payload: ContactEnquiryPayload): { success: boolean; leadId: string } => {
    const leadId = `LEAD-${Date.now().toString(36).toUpperCase()}`;

    const newLead: CRMLead = {
      id: leadId,
      source: "CONTACT_ENQUIRY",
      name: payload.fullName,
      phone: payload.phone,
      email: payload.email,
      interest: payload.interest.replace("_", " "),
      status: "NEW",
      createdAt: new Date().toISOString(),
      details: {
        message: payload.message,
      },
    };

    state = {
      ...state,
      leads: [newLead, ...state.leads],
      contactDraft: {}, // clear draft on success
    };
    notify();

    return { success: true, leadId };
  },

  saveContactDraft: (draft: Partial<ContactEnquiryPayload>) => {
    state = {
      ...state,
      contactDraft: { ...state.contactDraft, ...draft },
    };
    notify();
  },

  clearContactDraft: () => {
    state = {
      ...state,
      contactDraft: {},
    };
    notify();
  },
};

export function useWebsiteStore() {
  const currentSnapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return useMemo(
    () => ({
      ...currentSnapshot,
      ...websiteActions,
    }),
    [currentSnapshot]
  );
}
