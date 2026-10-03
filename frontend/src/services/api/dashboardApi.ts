import { apiClient } from "@/lib/axios";

export interface ClubInfoDto {
  clubName: string;
  timezone: string;
  currency: string;
  openTime: string;
  closeTime: string;
  dailyCap: number;
  holdMinutes: number;
}

export interface DashboardStatsDto {
  activeMembers: number;
  todayBookings: number;
  courtOccupancyPercent: number;
  todayRevenue: number;
  mtdRevenue: number;
  openDuesTotal: number;
  activeShiftsCount: number;
  occupancyBySport: Record<string, number>;
  revenueByDepartment: Record<string, number>;
}

export const dashboardApi = {
  getClubInfo: () =>
    apiClient.get<ClubInfoDto>("/api/public/club"),

  getStats: () =>
    apiClient.get<DashboardStatsDto>("/api/dashboard/stats"),
};
