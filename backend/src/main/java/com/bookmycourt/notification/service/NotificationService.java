package com.bookmycourt.notification.service;

import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.notification.dto.NotificationResponse;
import com.bookmycourt.notification.dto.SendNotificationRequest;
import com.bookmycourt.notification.entity.Notification;
import com.bookmycourt.notification.entity.NotificationDelivery;
import com.bookmycourt.notification.mapper.NotificationMapper;
import com.bookmycourt.notification.repository.NotificationDeliveryRepository;
import com.bookmycourt.notification.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private final NotificationRepository notifications;
    private final NotificationDeliveryRepository deliveries;
    private final AppUserRepository users;
    private final NotificationMapper mapper;

    public NotificationService(
            NotificationRepository notifications,
            NotificationDeliveryRepository deliveries,
            AppUserRepository users,
            NotificationMapper mapper) {
        this.notifications = notifications;
        this.deliveries = deliveries;
        this.users = users;
        this.mapper = mapper;
    }

    @Transactional
    public NotificationResponse sendNotification(SendNotificationRequest request) {
        AppUser user = users.findById(request.userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        Notification n = new Notification();
        n.setUser(user);
        n.setNotificationType(request.notificationType());
        n.setTitle(request.title());
        n.setMessage(request.message());
        n.setEntityType(request.entityType());
        n.setEntityId(request.entityId());
        n.setRead(false);

        List<NotificationDelivery> deliveryList = new ArrayList<>();
        List<String> channels = request.channels() != null && !request.channels().isEmpty()
                ? request.channels()
                : List.of("IN_APP");

        for (String ch : channels) {
            NotificationDelivery d = new NotificationDelivery();
            d.setNotification(n);
            d.setChannel(ch.toUpperCase());
            d.setAttemptedAt(Instant.now());
            if ("IN_APP".equalsIgnoreCase(ch)) {
                d.setStatus("DELIVERED");
                d.setDeliveredAt(Instant.now());
            } else {
                d.setStatus("SENT");
                d.setDeliveredAt(null);
            }
            deliveryList.add(d);
        }
        n.setDeliveries(deliveryList);

        notifications.save(n);
        return mapper.toResponse(n);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId, boolean unreadOnly) {
        List<Notification> list = unreadOnly
                ? notifications.findByUser_IdAndReadFalseOrderByCreatedAtDesc(userId)
                : notifications.findByUser_IdOrderByCreatedAtDesc(userId);
        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void markAsRead(UUID id) {
        Notification n = notifications.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found"));
        n.setRead(true);
        notifications.save(n);
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notifications.markAllAsRead(userId);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notifications.countByUser_IdAndReadFalse(userId);
    }
}
