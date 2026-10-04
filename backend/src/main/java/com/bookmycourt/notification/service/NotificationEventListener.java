package com.bookmycourt.notification.service;

import com.bookmycourt.booking.entity.Booking;
import com.bookmycourt.booking.repository.BookingRepository;
import com.bookmycourt.common.event.events.BookingEvents;
import com.bookmycourt.common.event.events.MembershipEvents;
import com.bookmycourt.common.event.events.MoneyEvents;
import com.bookmycourt.common.event.events.ShopEvents;
import com.bookmycourt.common.event.events.SocialEvents;
import com.bookmycourt.facility.entity.Court;
import com.bookmycourt.facility.repository.CourtRepository;
import com.bookmycourt.membership.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationService notificationService;
    private final BookingRepository bookingRepository;
    private final CourtRepository courtRepository;
    private final MemberRepository memberRepository;

    public NotificationEventListener(
            NotificationService notificationService,
            BookingRepository bookingRepository,
            CourtRepository courtRepository,
            MemberRepository memberRepository) {
        this.notificationService = notificationService;
        this.bookingRepository = bookingRepository;
        this.courtRepository = courtRepository;
        this.memberRepository = memberRepository;
    }

    @EventListener
    public void onBookingCreated(BookingEvents.BookingCreated event) {
        try {
            UUID memberId = event.memberId();
            String courtName = "Court";
            if (event.courtId() != null) {
                courtName = courtRepository.findById(event.courtId()).map(Court::getName).orElse("Court");
            }
            if (memberId == null && event.bookingId() != null) {
                Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
                if (b != null && b.getMember() != null) {
                    memberId = b.getMember().getId();
                }
            }

            notificationService.createNotification(
                    memberId,
                    "BOOKINGS",
                    "Court Booking Confirmed",
                    "Your slot on " + courtName + " is locked and confirmed.",
                    "BOOKING",
                    event.bookingId()
            );
            log.info("Notification dispatched for booking {}", event.bookingId());
        } catch (Exception e) {
            log.warn("Failed to create notification on BookingCreated", e);
        }
    }

    @EventListener
    public void onBookingConfirmed(BookingEvents.BookingConfirmed event) {
        try {
            UUID memberId = event.memberId();
            String courtName = "Court";
            if (event.courtId() != null) {
                courtName = courtRepository.findById(event.courtId()).map(Court::getName).orElse("Court");
            }
            notificationService.createNotification(
                    memberId,
                    "BOOKINGS",
                    "Booking Verified & Ready",
                    "Your court reservation on " + courtName + " is verified.",
                    "BOOKING",
                    event.bookingId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on BookingConfirmed", e);
        }
    }

    @EventListener
    public void onBookingCancelled(BookingEvents.BookingCancelled event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "BOOKINGS",
                    "Booking Cancelled",
                    "Your booking has been cancelled." + (event.reason() != null ? " (" + event.reason() + ")" : ""),
                    "BOOKING",
                    event.bookingId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on BookingCancelled", e);
        }
    }

    @EventListener
    public void onBookingRescheduled(BookingEvents.BookingRescheduled event) {
        try {
            UUID memberId = null;
            if (event.bookingId() != null) {
                Booking b = bookingRepository.findById(event.bookingId()).orElse(null);
                if (b != null && b.getMember() != null) {
                    memberId = b.getMember().getId();
                }
            }
            String courtName = "Court";
            if (event.newCourtId() != null) {
                courtName = courtRepository.findById(event.newCourtId()).map(Court::getName).orElse("Court");
            }
            notificationService.createNotification(
                    memberId,
                    "BOOKINGS",
                    "Court Rescheduled Successfully",
                    "Your booking has been moved to " + courtName + ".",
                    "BOOKING",
                    event.bookingId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on BookingRescheduled", e);
        }
    }

    @EventListener
    public void onShopOrderPlaced(ShopEvents.ShopOrderPlaced event) {
        try {
            String shortId = event.orderId() != null ? event.orderId().toString().substring(0, Math.min(8, event.orderId().toString().length())) : "";
            notificationService.createNotification(
                    event.memberId(),
                    "ORDERS",
                    "Pro Shop Order Confirmed",
                    "Order #" + shortId + " has been received and is being prepared.",
                    "SHOP_ORDER",
                    event.orderId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on ShopOrderPlaced", e);
        }
    }

    @EventListener
    public void onShopOrderStatusChanged(ShopEvents.ShopOrderStatusChanged event) {
        try {
            String shortId = event.orderId() != null ? event.orderId().toString().substring(0, Math.min(8, event.orderId().toString().length())) : "";
            notificationService.createNotification(
                    null,
                    "ORDERS",
                    "Pro Shop Order Updated",
                    "Order #" + shortId + " is now " + event.newStatus() + ".",
                    "SHOP_ORDER",
                    event.orderId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on ShopOrderStatusChanged", e);
        }
    }

    @EventListener
    public void onMemberRegistered(MembershipEvents.MemberRegistered event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "MEMBERSHIP",
                    "Welcome to Champions Club!",
                    "Your club account has been created. Start reserving courts, ordering pro-shop gear, and participating in club socials!",
                    "MEMBER",
                    event.memberId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on MemberRegistered", e);
        }
    }

    @EventListener
    public void onMembershipPurchased(MembershipEvents.MembershipPurchased event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "MEMBERSHIP",
                    "Membership Plan Activated",
                    "Your club membership privileges have been activated successfully.",
                    "MEMBERSHIP",
                    event.membershipId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on MembershipPurchased", e);
        }
    }

    @EventListener
    public void onMembershipRenewed(MembershipEvents.MembershipRenewed event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "MEMBERSHIP",
                    "Membership Successfully Renewed",
                    "Your membership privileges are active. Thank you for your continued loyalty.",
                    "MEMBERSHIP",
                    event.membershipId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on MembershipRenewed", e);
        }
    }

    @EventListener
    public void onMembershipTierChanged(MembershipEvents.MembershipTierChanged event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "MEMBERSHIP",
                    "Tier Upgrade: " + event.newTier(),
                    "Your membership tier is now " + event.newTier() + ". Enjoy your exclusive benefits!",
                    "MEMBER",
                    event.memberId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on MembershipTierChanged", e);
        }
    }

    @EventListener
    public void onInvoiceIssued(MoneyEvents.InvoiceIssued event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "PAYMENTS",
                    "Tax Invoice Issued #" + (event.invoiceNumber() != null ? event.invoiceNumber() : ""),
                    "Tax invoice for ₹" + (event.amount() != null ? event.amount().toRupees() : "") + " has been generated.",
                    "INVOICE",
                    event.invoiceId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on InvoiceIssued", e);
        }
    }

    @EventListener
    public void onPaymentRecorded(MoneyEvents.PaymentRecorded event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "PAYMENTS",
                    "Payment Received",
                    "Payment of ₹" + (event.amount() != null ? event.amount().toRupees() : "") + " received via " + event.method() + ".",
                    "PAYMENT",
                    event.paymentId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on PaymentRecorded", e);
        }
    }

    @EventListener
    public void onSocialParticipantJoined(SocialEvents.SocialParticipantJoined event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "BOOKINGS",
                    "Social Play Reserved",
                    "You have successfully reserved your spot for the social play session!",
                    "SOCIAL",
                    event.sessionId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on SocialParticipantJoined", e);
        }
    }

    @EventListener
    public void onSocialParticipantPromoted(SocialEvents.SocialParticipantPromoted event) {
        try {
            notificationService.createNotification(
                    event.memberId(),
                    "BOOKINGS",
                    "Social Play Waitlist Cleared",
                    "Great news! A slot opened up and you have been promoted to active player.",
                    "SOCIAL",
                    event.sessionId()
            );
        } catch (Exception e) {
            log.warn("Failed to create notification on SocialParticipantPromoted", e);
        }
    }
}
