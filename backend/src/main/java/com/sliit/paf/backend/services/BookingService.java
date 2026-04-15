package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.BookingDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Booking;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.BookingRepository;
import com.sliit.paf.backend.repository.ResourceRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public BookingDTO createBooking(String userEmail, BookingDTO dto) {
        User user = getUser(userEmail);
        Resource resource = getResource(dto.getResourceId());
        validateBookingWindow(dto, resource, null, false);

        Booking booking = new Booking();
        booking.setResourceId(resource.getId());
        booking.setResourceName(resource.getName());
        booking.setUserId(user.getId());
        booking.setUserName(user.getName());
        booking.setUserEmail(user.getEmail());
        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setExpectedAttendees(dto.getExpectedAttendees());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setCreatedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());

        return toDTO(bookingRepository.save(booking));
    }

    public List<BookingDTO> getMyBookings(String userEmail, String status, String resourceId, String bookingDate) {
        return bookingRepository.findByUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .filter(Objects::nonNull)
                .filter(booking -> matchesFilters(booking, status, resourceId, bookingDate))
                .sorted(Comparator.comparing(Booking::getBookingDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(Booking::getStartTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getAllBookings(String status, String resourceId, String bookingDate, String userEmail) {
        return bookingRepository.findAll().stream()
                .filter(Objects::nonNull)
                .filter(booking -> matchesFilters(booking, status, resourceId, bookingDate))
                .filter(booking -> userEmail == null || userEmail.isBlank()
                        || (booking.getUserEmail() != null
                        && booking.getUserEmail().toLowerCase(Locale.ROOT).contains(userEmail.toLowerCase(Locale.ROOT))))
                .sorted(Comparator.comparing(Booking::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public BookingDTO cancelBooking(String bookingId, String userEmail) {
        Booking booking = getBooking(bookingId);
        ensureOwner(booking, userEmail);
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled.");
        }
        if (booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new RuntimeException("Rejected bookings cannot be cancelled.");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setAdminReason("Cancelled by student");
        return toDTO(bookingRepository.save(booking));
    }

    public BookingDTO rescheduleBooking(String bookingId, String userEmail, BookingDTO dto) {
        Booking booking = getBooking(bookingId);
        ensureOwner(booking, userEmail);
        Resource resource = getResource(booking.getResourceId());

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cancelled bookings cannot be rescheduled.");
        }

        validateBookingWindow(dto, resource, booking.getId(), booking.getStatus() == Booking.BookingStatus.APPROVED);

        booking.setBookingDate(dto.getBookingDate());
        booking.setStartTime(dto.getStartTime());
        booking.setEndTime(dto.getEndTime());
        booking.setPurpose(dto.getPurpose());
        booking.setExpectedAttendees(dto.getExpectedAttendees());
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setAdminReason("Reschedule requested by student");
        booking.setReviewedAt(null);
        booking.setReviewedBy(null);
        booking.setUpdatedAt(LocalDateTime.now());

        return toDTO(bookingRepository.save(booking));
    }

    public BookingDTO approveBooking(String bookingId, String adminEmail) {
        Booking booking = getBooking(bookingId);
        validateExistingBookingConflict(booking, booking.getId());
        booking.setStatus(Booking.BookingStatus.APPROVED);
        booking.setAdminReason(null);
        booking.setReviewedBy(adminEmail);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        notificationService.notifyBookingApproved(saved.getUserId(), saved.getId(), saved.getResourceName());
        return toDTO(saved);
    }

    public BookingDTO rejectBooking(String bookingId, String adminEmail, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new RuntimeException("Rejection reason is required.");
        }
        Booking booking = getBooking(bookingId);
        booking.setStatus(Booking.BookingStatus.REJECTED);
        booking.setAdminReason(reason.trim());
        booking.setReviewedBy(adminEmail);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        notificationService.notifyBookingRejected(saved.getUserId(), saved.getId(), saved.getResourceName(), reason.trim());
        return toDTO(saved);
    }

    private boolean matchesFilters(Booking booking, String status, String resourceId, String bookingDate) {
        boolean matchesStatus = status == null || status.isBlank()
                || (booking.getStatus() != null && booking.getStatus().name().equalsIgnoreCase(status));
        boolean matchesResource = resourceId == null || resourceId.isBlank()
                || resourceId.equals(booking.getResourceId());
        boolean matchesDate = bookingDate == null || bookingDate.isBlank()
                || (booking.getBookingDate() != null && booking.getBookingDate().toString().equals(bookingDate));
        return matchesStatus && matchesResource && matchesDate;
    }

    private void validateBookingWindow(BookingDTO dto, Resource resource, String currentBookingId, boolean requireConflictCheck) {
        if (resource.getStatus() != Resource.ResourceStatus.ACTIVE) {
            throw new RuntimeException("Selected resource is currently unavailable.");
        }
        if (dto.getEndTime().isBefore(dto.getStartTime()) || dto.getEndTime().equals(dto.getStartTime())) {
            throw new RuntimeException("End time must be after start time.");
        }
        if (resource.getCapacity() > 0 && dto.getExpectedAttendees() != null
                && dto.getExpectedAttendees() > resource.getCapacity()) {
            throw new RuntimeException("Expected attendees exceed resource capacity.");
        }
        if (dto.getBookingDate() == null || dto.getBookingDate().isBefore(java.time.LocalDate.now())) {
            throw new RuntimeException("Booking date cannot be in the past.");
        }
        if (requireConflictCheck || currentBookingId == null) {
            validateConflict(resource.getId(), dto.getBookingDate(), dto.getStartTime(), dto.getEndTime(), currentBookingId);
        }
    }

    private void validateExistingBookingConflict(Booking booking, String currentBookingId) {
        validateConflict(booking.getResourceId(), booking.getBookingDate(), booking.getStartTime(), booking.getEndTime(), currentBookingId);
    }

    private void validateConflict(String resourceId,
                                  java.time.LocalDate bookingDate,
                                  java.time.LocalTime startTime,
                                  java.time.LocalTime endTime,
                                  String currentBookingId) {
        boolean conflict = bookingRepository.findByResourceIdAndBookingDate(resourceId, bookingDate).stream()
                .filter(existing -> existing.getStatus() == Booking.BookingStatus.APPROVED
                        || existing.getStatus() == Booking.BookingStatus.PENDING)
                .filter(existing -> currentBookingId == null || !existing.getId().equals(currentBookingId))
                .anyMatch(existing -> startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime()));

        if (conflict) {
            throw new RuntimeException("This resource already has a booking for the selected time range.");
        }
    }

    private Booking getBooking(String bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    private Resource getResource(String resourceId) {
        return resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private User getUser(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userEmail));
    }

    private void ensureOwner(Booking booking, String userEmail) {
        if (booking.getUserEmail() == null || !booking.getUserEmail().equalsIgnoreCase(userEmail)) {
            throw new RuntimeException("Unauthorized booking access.");
        }
    }

    public BookingDTO toDTO(Booking booking) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setResourceId(booking.getResourceId());
        dto.setResourceName(booking.getResourceName());
        dto.setUserId(booking.getUserId());
        dto.setUserName(booking.getUserName());
        dto.setUserEmail(booking.getUserEmail());
        dto.setBookingDate(booking.getBookingDate());
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setExpectedAttendees(booking.getExpectedAttendees());
        dto.setStatus(booking.getStatus());
        dto.setAdminReason(booking.getAdminReason());
        dto.setReviewedBy(booking.getReviewedBy());
        dto.setReviewedAt(booking.getReviewedAt());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }
}
