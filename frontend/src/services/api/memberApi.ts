import { apiClient } from "@/lib/axios";

export interface PlanDto {
  id: string;
  name: string;
  description: string;
  validityDays: number;
  advanceBookingDays: number;
  maxBookingsPerDay: number;
  price?: number;
}

export interface MemberDto {
  id: string;
  memberNumber: string;
  fullName: string;
  email: string;
  phone: string;
  tier: "Gold" | "Silver" | "Junior" | "Guest";
  status: "ACTIVE" | "EXPIRED" | "FROZEN" | "SUSPENDED";
  joinedDate?: string;
  validUntil?: string;
  activeMembership?: {
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

export interface RegisterMemberRequest {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  planId?: string;
  notes?: string;
}

export interface IssueMembershipRequest {
  memberId: string;
  planId: string;
  paymentMethod: "CASH" | "CARD" | "UPI" | "ONLINE" | "BANK_TRANSFER";
  notes?: string;
}

export const memberApi = {
  listPlans: () =>
    apiClient.get<PlanDto[]>("/api/public/plans"),

  listMembers: (search?: string) =>
    apiClient.get<MemberDto[]>("/api/members", search ? { q: search } : undefined),

  getMember: (id: string) =>
    apiClient.get<MemberDto>(`/api/members/${id}`),

  registerMember: (data: RegisterMemberRequest) =>
    apiClient.post<MemberDto>("/api/members", data),

  issueMembership: (data: IssueMembershipRequest) =>
    apiClient.post<{ membershipId: string; invoiceId: string; status: string }>(
      "/api/memberships/issue",
      data
    ),

  renewMembership: (id: string) =>
    apiClient.post<{ membershipId: string; validUntil: string }>(`/api/memberships/${id}/renew`),

  upgradeMembership: (id: string, newPlanId: string) =>
    apiClient.post<{ membershipId: string; proratedAmount: number }>(
      `/api/memberships/${id}/upgrade`,
      { newPlanId }
    ),

  freezeMembership: (id: string, months: number = 1) =>
    apiClient.post<{ membershipId: string; status: string }>(
      `/api/memberships/${id}/freeze`,
      { months }
    ),
};
