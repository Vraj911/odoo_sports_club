import { apiClient } from "@/lib/axios";

export interface LeadDto {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  sportInterest?: string;
  status: "NEW" | "CONTACTED" | "TRIAL_BOOKED" | "QUOTE_SENT" | "WON" | "LOST";
  lossReason?: string;
  estimatedValue?: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  createdAt: string;
  lastContactedAt?: string;
}

export interface PipelineSummaryDto {
  totalLeads: number;
  stageCounts: Record<string, number>;
  totalEstimatedValue: number;
  overdueFollowUps: number;
  conversionRate: number;
  leadsByStage: Record<string, LeadDto[]>;
}

export interface CreateLeadRequest {
  name: string;
  phone: string;
  email?: string;
  source: string;
  sportInterest?: string;
  estimatedValue?: number;
  notes?: string;
}

export interface QuoteLineRequest {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
}

export interface CreateQuoteRequest {
  leadId: string;
  validDays: number;
  notes?: string;
  lines: QuoteLineRequest[];
}

export interface QuoteDto {
  id: string;
  quoteNumber: string;
  leadId: string;
  leadName: string;
  total: number;
  validUntil: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "EXPIRED";
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxPercent: number;
    lineTotal: number;
  }[];
}

export const crmApi = {
  getPipeline: () =>
    apiClient.get<PipelineSummaryDto>("/api/crm/pipeline"),

  createLead: (data: CreateLeadRequest) =>
    apiClient.post<LeadDto>("/api/crm/leads", data),

  updateLeadStage: (id: string, stage: string, reason?: string) =>
    apiClient.post<LeadDto>(`/api/crm/leads/${id}/stage`, { stage, reason }),

  createQuote: (data: CreateQuoteRequest) =>
    apiClient.post<QuoteDto>("/api/crm/quotes", data),

  getOverdueFollowUps: () =>
    apiClient.get<Record<string, unknown>[]>("/api/crm/follow-ups/overdue"),
};
