import { apiClient } from "@/lib/axios";

export interface SocialSessionDto {
  id: string;
  courtId: string;
  courtName: string;
  title: string;
  sport: string;
  startTime: string;
  endTime: string;
  capacity: number;
  currentPlayersCount: number;
  status: "OPEN" | "FULL" | "COMPLETED" | "CANCELLED";
  hostMemberId?: string;
  hostMemberName?: string;
  priceByTier?: Record<string, number>;
  participants: {
    memberId: string;
    memberName: string;
    tier: string;
    joinedAt: string;
  }[];
}

export interface CreateSessionRequest {
  courtId: string;
  title: string;
  sport: string;
  startTime: string;
  endTime: string;
  capacity: number;
  notes?: string;
}

export const socialApi = {
  listSessions: (date?: string) =>
    apiClient.get<SocialSessionDto[]>("/api/social/sessions", date ? { date } : undefined),

  getSession: (id: string) =>
    apiClient.get<SocialSessionDto>(`/api/social/sessions/${id}`),

  createSession: (data: CreateSessionRequest) =>
    apiClient.post<SocialSessionDto>("/api/social/sessions", data),

  joinSession: (id: string, memberId?: string) =>
    apiClient.post<{ sessionId: string; status: string }>(`/api/social/sessions/${id}/join`, { memberId }),

  leaveSession: (id: string, memberId?: string) =>
    apiClient.post<{ sessionId: string; status: string }>(`/api/social/sessions/${id}/leave`, { memberId }),

  completeSession: (id: string, score: string) =>
    apiClient.post<{ sessionId: string; status: string }>(`/api/social/sessions/${id}/complete`, { score }),
};
