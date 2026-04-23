package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.BookingDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Booking;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.BookingRepository;
import com.sliit.paf.backend.repository.ResourceRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for BookingService — Member 2
 */
@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock private BookingRepository bookingRepository;
    @Mock private ResourceRepository resourceRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private MongoTemplate mongoTemplate;

    @InjectMocks private BookingService bookingService;

    private User testUser;
    private Resource testResource;
    private Booking testBooking;
    private BookingDTO testDTO;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-001");
        testUser.setEmail("student@test.com");
        testUser.setName("Test Student");
        testUser.setRoles(Set.of("ROLE_USER"));

        testResource = new Resource();
        testResource.setId("res-001");
        testResource.setName("Lab 04");
        testResource.setStatus(Resource.ResourceStatus.ACTIVE);
        testResource.setCapacity(30);
        testResource.setCurrency("LKR");

        testBooking = new Booking();
        testBooking.setId("book-001");
        testBooking.setResourceId("res-001");
        testBooking.setResourceName("Lab 04");
        testBooking.setUserId("user-001");
        testBooking.setUserEmail("student@test.com");
        testBooking.setUserName("Test Student");
        testBooking.setBookingDate(LocalDate.now().plusDays(1));
        testBooking.setStartTime(LocalTime.of(9, 0));
        testBooking.setEndTime(LocalTime.of(11, 0));
        testBooking.setPurpose("Study session");
        testBooking.setExpectedAttendees(5);
        testBooking.setStatus(Booking.BookingStatus.PENDING);
        testBooking.setCreatedAt(LocalDateTime.now());
        testBooking.setUpdatedAt(LocalDateTime.now());

        testDTO = new BookingDTO();
        testDTO.setResourceId("res-001");
        testDTO.setBookingDate(LocalDate.now().plusDays(1));
        testDTO.setStartTime(LocalTime.of(9, 0));
        testDTO.setEndTime(LocalTime.of(11, 0));
        testDTO.setPurpose("Study session");
        testDTO.setExpectedAttendees(5);
    }

    // ── approveBooking ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("approveBooking — should set status to APPROVED")
    void approveBooking_shouldSetApproved() {
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));
        when(resourceRepository.findById("res-001")).thenReturn(Optional.of(testResource));
        when(bookingRepository.findByResourceIdAndBookingDate(any(), any())).thenReturn(List.of());
        when(bookingRepository.save(any())).thenReturn(testBooking);

        bookingService.approveBooking("book-001", "admin@test.com");

        verify(bookingRepository).save(any(Booking.class));
        verify(notificationService).notifyBookingApproved(any(), any(), any());
    }

    @Test
    @DisplayName("approveBooking — should throw when booking not PENDING")
    void approveBooking_shouldThrow_whenNotPending() {
        testBooking.setStatus(Booking.BookingStatus.APPROVED);
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));

        assertThatThrownBy(() -> bookingService.approveBooking("book-001", "admin@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("pending");
    }

    @Test
    @DisplayName("approveBooking — should throw when booking not found")
    void approveBooking_shouldThrow_whenNotFound() {
        when(bookingRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.approveBooking("bad-id", "admin@test.com"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── rejectBooking ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("rejectBooking — should set status to REJECTED with reason")
    void rejectBooking_shouldSetRejected() {
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any())).thenReturn(testBooking);

        bookingService.rejectBooking("book-001", "admin@test.com", "Room unavailable");

        verify(bookingRepository).save(argThat(b -> b.getStatus() == Booking.BookingStatus.REJECTED));
        verify(notificationService).notifyBookingRejected(any(), any(), any(), eq("Room unavailable"));
    }

    @Test
    @DisplayName("rejectBooking — should throw when reason is blank")
    void rejectBooking_shouldThrow_whenReasonBlank() {
        assertThatThrownBy(() -> bookingService.rejectBooking("book-001", "admin@test.com", ""))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("reason");
    }

    @Test
    @DisplayName("rejectBooking — should throw when booking not PENDING")
    void rejectBooking_shouldThrow_whenNotPending() {
        testBooking.setStatus(Booking.BookingStatus.APPROVED);
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));

        assertThatThrownBy(() -> bookingService.rejectBooking("book-001", "admin@test.com", "reason"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("pending");
    }

    // ── cancelBooking ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("cancelBooking — owner can cancel their own booking")
    void cancelBooking_ownerCanCancel() {
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(testUser));
        when(bookingRepository.save(any())).thenReturn(testBooking);

        bookingService.cancelBooking("book-001", "student@test.com");

        verify(bookingRepository).save(argThat(b -> b.getStatus() == Booking.BookingStatus.CANCELLED));
    }

    @Test
    @DisplayName("cancelBooking — should throw when already cancelled")
    void cancelBooking_shouldThrow_whenAlreadyCancelled() {
        testBooking.setStatus(Booking.BookingStatus.CANCELLED);
        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));
        when(userRepository.findByEmail("student@test.com")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> bookingService.cancelBooking("book-001", "student@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("already cancelled");
    }

    @Test
    @DisplayName("cancelBooking — should throw when user is not the owner")
    void cancelBooking_shouldThrow_whenNotOwner() {
        User otherUser = new User();
        otherUser.setId("user-002");
        otherUser.setEmail("other@test.com");
        otherUser.setRoles(Set.of("ROLE_USER"));

        when(bookingRepository.findById("book-001")).thenReturn(Optional.of(testBooking));
        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> bookingService.cancelBooking("book-001", "other@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    // ── toDTO ──────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("toDTO — should correctly map Booking to BookingDTO")
    void toDTO_shouldMapCorrectly() {
        BookingDTO dto = bookingService.toDTO(testBooking);

        assertThat(dto.getId()).isEqualTo("book-001");
        assertThat(dto.getResourceId()).isEqualTo("res-001");
        assertThat(dto.getUserEmail()).isEqualTo("student@test.com");
        assertThat(dto.getStatus()).isEqualTo(Booking.BookingStatus.PENDING);
        assertThat(dto.getPurpose()).isEqualTo("Study session");
    }
}
