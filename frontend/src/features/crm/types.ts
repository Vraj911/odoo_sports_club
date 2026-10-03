// Types for CCMS CRM module (Leads, Follow-ups, Activities, Quotes, Campaigns)

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "QUOTE_SENT"
  | "TRIAL_BOOKED"
  | "WON"
  | "LOST";

export type LeadSource =
  | "WEBSITE"
  | "TRIAL"
  | "WALK_IN"
  | "PHONE"
  | "REFERRAL";

export type ActivityType =
  | "NOTE"
  | "CALL"
  | "EMAIL"
  | "STAGE_CHANGE"
  | "QUOTE_CREATED"
  | "QUOTE_SENT"
  | "TRIAL_BOOKED"
  | "CONVERTED"
  | "LOST";

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  author: string;
  authorRole?: string;
  title: string;
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface FollowUpTask {
  id: string;
  leadId: string;
  title: string;
  dueAt: string; // ISO date-time string
  completed: boolean;
  completedAt?: string;
  assignedTo: string;
  notes?: string;
}

export interface QuoteItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  gstPercent: number; // typically 18
  amount: number; // (qty * rate) + gst
}

export interface Quote {
  id: string;
  leadId: string;
  quoteNumber: string;
  quoteType: "MEMBERSHIP" | "CORPORATE" | "CUSTOM";
  items: QuoteItem[];
  subtotal: number;
  gstTotal: number;
  grandTotal: number;
  validUntil: string;
  terms: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED" | "INVOICED";
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  stage: LeadStage;
  source: LeadSource;
  interest: string;
  owner: string;
  ownerAvatar?: string;
  estimatedValue: number; // in INR
  createdAt: string;
  nextFollowUp?: string; // ISO date-time
  lostReason?: string;
  companyName?: string;
  trialBookingRef?: string;
  convertedMemberId?: string;
  notes?: string;
}

export interface CampaignSegment {
  tier?: "ALL" | "Gold" | "Silver" | "Junior";
  leadStage?: "ALL" | LeadStage;
  source?: "ALL" | LeadSource;
  interest?: string;
}

export interface Campaign {
  id: string;
  title: string;
  channel: "EMAIL" | "SMS";
  segment: CampaignSegment;
  subject: string;
  content: string;
  status: "DRAFT" | "SENT" | "SCHEDULED";
  createdAt: string;
  sentAt?: string;
  recipientCount: number;
  openCount: number;
  clickCount: number;
  conversionCount: number;
}

export interface CorporateClientPayload {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  gstin: string;
  billingAddress: string;
  city: string;
  pincode: string;
  ratePlan: "CORP_ANNUAL" | "CORP_TOURNAMENT" | "EXECUTIVE_WELLNESS";
  notes?: string;
}
