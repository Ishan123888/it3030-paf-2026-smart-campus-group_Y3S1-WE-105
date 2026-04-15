package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.NotificationDTO;
import com.sliit.paf.backend.models.Notification;
import com.sliit.paf.backend.repository.NotificationRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * NotificationService — fixed version
 *
 * Key fixes:
 * 1. All userId values stored + queried as lowercase email → no casing mismatch.
 * 2. notifyBookingApproved / Rejected accept userId (MongoDB ObjectId) but we
 *    resolve the email first so the stored key is always the email address,
 *    which is what the JWT subject / Principal.getName() returns.
 * 3. createNotification(String userId, ...) now resolves MongoDB ObjectId → email
 *    if the value looks like a Mongo ID (24-char hex), so BookingService callers
 *    passing user.getId() still work correctly.
 */
@Service
@Transactional
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                                UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    /**
     * Primary internal method. Accepts either an email address OR a MongoDB
     * ObjectId string. If it looks like a Mongo ID (24 hex chars) we resolve it
     * to the user's email so every notification is keyed by email (matching
     * what Principal.getName() returns from the JWT).
     */
    public void createNotification(String userId, String type, String title,
                                   String message, String referenceId, String referenceType) {
        String resolvedEmail = resolveToEmail(userId);
        if (resolvedEmail == null) {
            log.warn("createNotification: could not resolve userId '{}' to an email — skipping", userId);
            return;
        }
        Notification notification = new Notification(
                resolvedEmail, type, title, message, referenceId, referenceType);
        notificationRepository.save(notification);
    }

    /** API-facing variant (used by NotificationController). */
    public NotificationDTO createNotification(NotificationDTO dto) {
        if (dto.getUserId() == null || dto.getUserId().isBlank()) {
            throw new IllegalArgumentException("Notification recipient userId is required");
        }
        String resolvedEmail = resolveToEmail(dto.getUserId());
        if (resolvedEmail == null) {
            throw new IllegalArgumentException("Cannot resolve userId '" + dto.getUserId() + "' to a user");
        }
        Notification notification = new Notification(
                resolvedEmail,
                dto.getType(),
                dto.getTitle(),
                dto.getMessage(),
                dto.getReferenceId(),
                dto.getReferenceType()
        );
        return toDTO(notificationRepository.save(notification));
    }

    // ── Booking Notifications ─────────────────────────────────────────────────

    public void notifyBookingApproved(String userId, String bookingId, String resourceName) {
        createNotification(userId, "BOOKING_APPROVED", "Booking Approved",
                "Your booking for " + resourceName + " has been approved.", bookingId, "BOOKING");
    }

    public void notifyBookingRejected(String userId, String bookingId, String resourceName, String reason) {
        createNotification(userId, "BOOKING_REJECTED", "Booking Rejected",
                "Your booking for " + resourceName + " was rejected. Reason: " + reason, bookingId, "BOOKING");
    }

    // ── Incident Notifications ────────────────────────────────────────────────

    public void notifyTicketStatusChanged(String userId, String ticketId, String newStatus) {
        createNotification(userId, "TICKET_STATUS_CHANGED",
                "Ticket Status Updated",
                "Your incident ticket status has changed to: " + newStatus,
                ticketId, "TICKET");
    }

    public void notifyNewComment(String userId, String ticketId) {
        createNotification(userId, "NEW_COMMENT",
                "New Comment on Your Ticket",
                "Someone added a comment to your incident ticket.",
                ticketId, "TICKET");
    }

    // ── Retrieval ─────────────────────────────────────────────────────────────

    public List<NotificationDTO> getUserNotifications(String userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(normalize(userId))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<NotificationDTO> getUnreadNotifications(String userId) {
        return notificationRepository
                .findByUserIdAndReadFalse(normalize(userId))
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(normalize(userId));
    }

    // ── Updates ───────────────────────────────────────────────────────────────

    public NotificationDTO markAsRead(String notificationId, String userId, boolean allowAdmin) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!isRecipient(notification.getUserId(), normalize(userId)) && !allowAdmin) {
            throw new RuntimeException("Unauthorized");
        }
        notification.setRead(true);
        return toDTO(notificationRepository.save(notification));
    }

    public void markAllAsRead(String userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndReadFalse(normalize(userId));
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public void deleteNotification(String notificationId, String userId, boolean allowAdmin) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!isRecipient(notification.getUserId(), normalize(userId)) && !allowAdmin) {
            throw new RuntimeException("Unauthorized");
        }
        notificationRepository.delete(notification);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * If the value looks like a MongoDB ObjectId (24 hex chars) we try to
     * fetch the user and return their email. Otherwise we treat it as an email
     * and normalise it to lowercase.
     */
    private String resolveToEmail(String userId) {
        if (userId == null) return null;
        String trimmed = userId.trim();
        if (trimmed.matches("[0-9a-fA-F]{24}")) {
            // Mongo ObjectId → look up the user
            return userRepository.findById(trimmed)
                    .map(u -> normalize(u.getEmail()))
                    .orElse(null);
        }
        // Treat as email
        return normalize(trimmed);
    }

    private boolean isRecipient(String storedUserId, String principalUserId) {
        return storedUserId != null && principalUserId != null
                && storedUserId.equalsIgnoreCase(principalUserId);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim().toLowerCase(Locale.ROOT);
    }

    private NotificationDTO toDTO(Notification n) {
        return new NotificationDTO(
                n.getId(), n.getUserId(), n.getType(), n.getTitle(), n.getMessage(),
                n.getReferenceId(), n.getReferenceType(), n.isRead(), n.getCreatedAt()
        );
    }
}