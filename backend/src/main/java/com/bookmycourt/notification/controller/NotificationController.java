package com.bookmycourt.notification.controller;

import com.bookmycourt.common.response.ApiResponse;
import com.bookmycourt.notification.dto.NotificationResponse;
import com.bookmycourt.notification.dto.SendNotificationRequest;
import com.bookmycourt.notification.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<NotificationResponse> sendNotification(@Valid @RequestBody SendNotificationRequest request) {
        return ApiResponse.success("Notification sent", notifications.sendNotification(request));
    }

    @GetMapping
    public ApiResponse<List<NotificationResponse>> getUserNotifications(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false, defaultValue = "false") boolean unreadOnly) {
        return ApiResponse.success("Notifications loaded", notifications.getUserNotifications(userId, unreadOnly));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<Void> markAsRead(@PathVariable String id) {
        try {
            notifications.markAsRead(UUID.fromString(id));
        } catch (IllegalArgumentException ignored) {
        }
        return ApiResponse.success("Notification marked read", null);
    }

    @PostMapping("/mark-all-read")
    public ApiResponse<Void> markAllAsRead(@RequestParam(required = false) String userId) {
        notifications.markAllAsRead(userId);
        return ApiResponse.success("All notifications marked read", null);
    }

    @GetMapping("/unread-count")
    public ApiResponse<Map<String, Long>> getUnreadCount(@RequestParam(required = false) String userId) {
        return ApiResponse.success("Unread count loaded", Map.of("unreadCount", notifications.getUnreadCount(userId)));
    }

    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    public ApiResponse<Void> deleteNotification(@PathVariable String id) {
        try {
            notifications.deleteNotification(UUID.fromString(id));
        } catch (IllegalArgumentException ignored) {
        }
        return ApiResponse.success("Notification deleted", null);
    }
}
