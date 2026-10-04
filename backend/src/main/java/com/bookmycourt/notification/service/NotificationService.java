package com.bookmycourt.notification.service;

import com.bookmycourt.common.actor.Actor;
import com.bookmycourt.common.actor.ActorHolder;
import com.bookmycourt.common.exception.NotFoundException;
import com.bookmycourt.membership.entity.AppUser;
import com.bookmycourt.membership.entity.Member;
import com.bookmycourt.membership.repository.AppUserRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import com.bookmycourt.notification.dto.NotificationResponse;
import com.bookmycourt.notification.dto.SendNotificationRequest;
import com.bookmycourt.notification.entity.Notification;
import com.bookmycourt.notification.entity.NotificationDelivery;
import com.bookmycourt.notification.mapper.NotificationMapper;
import com.bookmycourt.notification.repository.NotificationDeliveryRepository;
import com.bookmycourt.notification.repository.NotificationRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notifications;
    private final NotificationDeliveryRepository deliveries;
    private final AppUserRepository users;
    private final MemberRepository members;
    private final NotificationMapper mapper;

    public NotificationService(
            NotificationRepository notifications,
            NotificationDeliveryRepository deliveries,
            AppUserRepository users,
            MemberRepository members,
            NotificationMapper mapper) {
        this.notifications = notifications;
        this.deliveries = deliveries;
        this.users = users;
        this.members = members;
        this.mapper = mapper;
    }

    @PostConstruct
    @Transactional
    public void cleanupMockNotifications() {
        try {
            notifications.deleteByTitleIn(List.of(
                    "Welcome to Champions Club!",
                    "Tournament Floodlights Active",
                    "Exclusive Pro Shop Privilege",
                    "Zero Double-Booking Engine"
            ));
            log.info("Cleaned up legacy mock notification seeds");
        } catch (Exception e) {
            log.debug("No mock notification cleanup needed: {}", e.getMessage());
        }
    }

    public AppUser resolveUser(UUID userId) {
        if (userId != null) {
            Optional<AppUser> userOpt = users.findById(userId);
            if (userOpt.isPresent()) {
                return userOpt.get();
            }
            Optional<Member> memberOpt = members.findById(userId);
            if (memberOpt.isPresent()) {
                Member m = memberOpt.get();
                if (m.getUser() != null) {
                    return m.getUser();
                }
                // If member exists without an AppUser, create and link one
                AppUser u = new AppUser();
                u.setEmail(m.getEmail());
                u.setPhone(m.getPhone());
                u.setFirstName(m.getFirstName());
                u.setLastName(m.getLastName());
                u.setRole("MEMBER");
                u.setActive(true);
                u = users.save(u);
                m.setUser(u);
                members.save(m);
                return u;
            }
        }

        Actor actor = ActorHolder.current();
        if (actor != null && actor.userId() != null) {
            Optional<AppUser> userOpt = users.findById(actor.userId());
            if (userOpt.isPresent()) {
                return userOpt.get();
            }
            Optional<Member> memberOpt = members.findById(actor.userId());
            if (memberOpt.isPresent() && memberOpt.get().getUser() != null) {
                return memberOpt.get().getUser();
            }
        }

        return users.findAll().stream().findFirst().orElse(null);
    }

    public AppUser resolveUser(String identifier) {
        if (identifier != null && !identifier.isBlank()) {
            String trimmed = identifier.trim();
            try {
                return resolveUser(UUID.fromString(trimmed));
            } catch (IllegalArgumentException ignored) {
            }

            // Check if it's a member code
            Optional<Member> memberByCode = members.findByMemberCode(trimmed);
            if (memberByCode.isPresent()) {
                return resolveUser(memberByCode.get().getId());
            }

            // Check if it's an email
            if (trimmed.contains("@")) {
                Optional<AppUser> userByEmail = users.findByEmailIgnoreCase(trimmed);
                if (userByEmail.isPresent()) {
                    return userByEmail.get();
                }
            }
        }
        return resolveUser((UUID) null);
    }

    @Transactional
    public NotificationResponse sendNotification(SendNotificationRequest request) {
        AppUser user = resolveUser(request.userId());
        if (user == null) {
            throw new NotFoundException("User not found for notification");
        }

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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(UUID userId, String type, String title, String message, String entityType, UUID entityId) {
        AppUser user = resolveUser(userId);
        if (user == null) return;

        Notification n = new Notification();
        n.setUser(user);
        n.setNotificationType(type);
        n.setTitle(title);
        n.setMessage(message);
        n.setEntityType(entityType);
        n.setEntityId(entityId);
        n.setRead(false);

        NotificationDelivery d = new NotificationDelivery();
        d.setNotification(n);
        d.setChannel("IN_APP");
        d.setAttemptedAt(Instant.now());
        d.setStatus("DELIVERED");
        d.setDeliveredAt(Instant.now());
        n.setDeliveries(List.of(d));

        notifications.save(n);
        log.info("Real notification saved: type={}, title='{}', user={}", type, title, user.getId());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(UUID userId, boolean unreadOnly) {
        AppUser user = resolveUser(userId);
        if (user == null) {
            return List.of();
        }

        List<Notification> list = unreadOnly
                ? notifications.findByUser_IdAndReadFalseOrderByCreatedAtDesc(user.getId())
                : notifications.findByUser_IdOrderByCreatedAtDesc(user.getId());

        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUserNotifications(String userIdentifier, boolean unreadOnly) {
        AppUser user = resolveUser(userIdentifier);
        if (user == null) {
            return List.of();
        }

        List<Notification> list = unreadOnly
                ? notifications.findByUser_IdAndReadFalseOrderByCreatedAtDesc(user.getId())
                : notifications.findByUser_IdOrderByCreatedAtDesc(user.getId());

        return list.stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public void markAsRead(UUID id) {
        notifications.findById(id).ifPresent(n -> {
            n.setRead(true);
            notifications.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        AppUser user = resolveUser(userId);
        if (user != null) {
            notifications.markAllAsRead(user.getId());
        }
    }

    @Transactional
    public void markAllAsRead(String userIdentifier) {
        AppUser user = resolveUser(userIdentifier);
        if (user != null) {
            notifications.markAllAsRead(user.getId());
        }
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        AppUser user = resolveUser(userId);
        if (user == null) {
            return 0;
        }
        return notifications.countByUser_IdAndReadFalse(user.getId());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userIdentifier) {
        AppUser user = resolveUser(userIdentifier);
        if (user == null) {
            return 0;
        }
        return notifications.countByUser_IdAndReadFalse(user.getId());
    }

    @Transactional
    public void deleteNotification(UUID id) {
        notifications.findById(id).ifPresent(notifications::delete);
    }
}
