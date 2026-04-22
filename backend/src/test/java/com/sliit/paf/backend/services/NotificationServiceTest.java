package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.NotificationDTO;
import com.sliit.paf.backend.models.Notification;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.NotificationRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for NotificationService — Member 4
 */
@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private NotificationService notificationService;

    private User testUser;
    private Notification testNotification;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-001");
        testUser.setEmail("user@test.com");
        testUser.setName("Test User");
        testUser.setRoles(Set.of("ROLE_USER"));

        testNotification = new Notification(
                "user@test.com",
                "BOOKING_APPROVED",
                "Booking Approved",
                "Your booking for Lab 04 has been approved.",
                "book-001",
                "BOOKING"
        );
        testNotification.setId("notif-001");
        testNotification.setRead(false);
        testNotification.setCreatedAt(LocalDateTime.now());
    }

    // ── createNotification ─────────────────────────────────────────────────────

    @Test
    @DisplayName("createNotification — saves notification with email as userId")
    void createNotification_savesWithEmail() {
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.createNotification(
                "user@test.com", "BOOKING_APPROVED", "Booking Approved",
                "Your booking was approved", "book-001", "BOOKING"
        );

        verify(notificationRepository).save(argThat(n ->
                n.getUserId().equals("user@test.com") &&
                n.getType().equals("BOOKING_APPROVED")
        ));
    }

    @Test
    @DisplayName("createNotification — resolves MongoDB ObjectId to email")
    void createNotification_resolvesMongoIdToEmail() {
        String mongoId = "507f1f77bcf86cd799439011"; // 24-char hex
        when(userRepository.findById(mongoId)).thenReturn(Optional.of(testUser));
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.createNotification(
                mongoId, "BOOKING_APPROVED", "Title", "Message", "ref-001", "BOOKING"
        );

        verify(notificationRepository).save(argThat(n ->
                n.getUserId().equals("user@test.com")
        ));
    }

    @Test
    @DisplayName("createNotification — skips when userId cannot be resolved")
    void createNotification_skipsWhenUnresolvable() {
        String mongoId = "507f1f77bcf86cd799439099";
        when(userRepository.findById(mongoId)).thenReturn(Optional.empty());

        notificationService.createNotification(
                mongoId, "TYPE", "Title", "Message", "ref", "BOOKING"
        );

        verify(notificationRepository, never()).save(any());
    }

    // ── notifyBookingApproved ──────────────────────────────────────────────────

    @Test
    @DisplayName("notifyBookingApproved — creates BOOKING_APPROVED notification")
    void notifyBookingApproved_createsCorrectNotification() {
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.notifyBookingApproved("user@test.com", "book-001", "Lab 04");

        verify(notificationRepository).save(argThat(n ->
                n.getType().equals("BOOKING_APPROVED") &&
                n.getMessage().contains("Lab 04") &&
                n.getReferenceId().equals("book-001")
        ));
    }

    // ── notifyBookingRejected ──────────────────────────────────────────────────

    @Test
    @DisplayName("notifyBookingRejected — creates BOOKING_REJECTED notification with reason")
    void notifyBookingRejected_createsCorrectNotification() {
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.notifyBookingRejected("user@test.com", "book-001", "Lab 04", "Room unavailable");

        verify(notificationRepository).save(argThat(n ->
                n.getType().equals("BOOKING_REJECTED") &&
                n.getMessage().contains("Room unavailable")
        ));
    }

    // ── getUserNotifications ───────────────────────────────────────────────────

    @Test
    @DisplayName("getUserNotifications — returns notifications for user")
    void getUserNotifications_returnsForUser() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc("user@test.com"))
                .thenReturn(List.of(testNotification));

        List<NotificationDTO> result = notificationService.getUserNotifications("user@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getType()).isEqualTo("BOOKING_APPROVED");
    }

    @Test
    @DisplayName("getUserNotifications — normalises email to lowercase")
    void getUserNotifications_normalisesEmail() {
        when(notificationRepository.findByUserIdOrderByCreatedAtDesc("user@test.com"))
                .thenReturn(List.of(testNotification));

        notificationService.getUserNotifications("USER@TEST.COM");

        verify(notificationRepository).findByUserIdOrderByCreatedAtDesc("user@test.com");
    }

    // ── getUnreadCount ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUnreadCount — returns correct count")
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByUserIdAndReadFalse("user@test.com")).thenReturn(3L);

        long count = notificationService.getUnreadCount("user@test.com");

        assertThat(count).isEqualTo(3L);
    }

    // ── markAsRead ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("markAsRead — sets read to true")
    void markAsRead_setsReadTrue() {
        when(notificationRepository.findById("notif-001")).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.markAsRead("notif-001", "user@test.com", false);

        verify(notificationRepository).save(argThat(Notification::isRead));
    }

    @Test
    @DisplayName("markAsRead — throws when notification not found")
    void markAsRead_throwsWhenNotFound() {
        when(notificationRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> notificationService.markAsRead("bad-id", "user@test.com", false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    @Test
    @DisplayName("markAsRead — throws when user is not the recipient")
    void markAsRead_throwsWhenUnauthorized() {
        when(notificationRepository.findById("notif-001")).thenReturn(Optional.of(testNotification));

        assertThatThrownBy(() -> notificationService.markAsRead("notif-001", "other@test.com", false))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    // ── markAllAsRead ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("markAllAsRead — marks all unread notifications as read")
    void markAllAsRead_marksAll() {
        Notification n2 = new Notification("user@test.com", "TYPE", "T", "M", "r", "BOOKING");
        n2.setRead(false);
        when(notificationRepository.findByUserIdAndReadFalse("user@test.com"))
                .thenReturn(List.of(testNotification, n2));

        notificationService.markAllAsRead("user@test.com");

        verify(notificationRepository).saveAll(argThat(list ->
                ((List<Notification>) list).stream().allMatch(Notification::isRead)
        ));
    }

    // ── deleteNotification ─────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteNotification — owner can delete their notification")
    void deleteNotification_ownerCanDelete() {
        when(notificationRepository.findById("notif-001")).thenReturn(Optional.of(testNotification));

        notificationService.deleteNotification("notif-001", "user@test.com", false);

        verify(notificationRepository).delete(testNotification);
    }

    @Test
    @DisplayName("deleteNotification — admin can delete any notification")
    void deleteNotification_adminCanDelete() {
        when(notificationRepository.findById("notif-001")).thenReturn(Optional.of(testNotification));

        notificationService.deleteNotification("notif-001", "admin@test.com", true);

        verify(notificationRepository).delete(testNotification);
    }

    // ── notifyTicketStatusChanged ──────────────────────────────────────────────

    @Test
    @DisplayName("notifyTicketStatusChanged — creates TICKET_STATUS_CHANGED notification")
    void notifyTicketStatusChanged_createsNotification() {
        when(notificationRepository.save(any())).thenReturn(testNotification);

        notificationService.notifyTicketStatusChanged("user@test.com", "inc-001", "RESOLVED");

        verify(notificationRepository).save(argThat(n ->
                n.getType().equals("TICKET_STATUS_CHANGED") &&
                n.getMessage().contains("RESOLVED")
        ));
    }
}
