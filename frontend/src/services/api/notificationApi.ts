import { apiClient } from "@/lib/axios";

export interface NotificationDto {
  id: string;
  userId: string;
  notificationType: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  listNotifications: (userId?: string, unreadOnly: boolean = false) =>
    apiClient.get<NotificationDto[]>("/api/notifications", {
      ...(userId ? { userId } : {}),
      unreadOnly,
    }),

  markRead: (id: string) =>
    apiClient.patch<void>(`/api/notifications/${id}/read`),

  markAllRead: (userId?: string) =>
    apiClient.post<void>(`/api/notifications/mark-all-read`, null, {
      params: userId ? { userId } : undefined,
    }),

  deleteNotification: (id: string) =>
    apiClient.delete<void>(`/api/notifications/${id}`),

  getUnreadCount: (userId?: string) =>
    apiClient.get<{ unreadCount: number }>("/api/notifications/unread-count", {
      ...(userId ? { userId } : {}),
    }),
};
