package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.BookingDTO;
import com.sliit.paf.backend.dto.BookingAvailabilityDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Booking;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.BookingRepository;
import com.sliit.paf.backend.repository.ResourceRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class BookingService {
    private static final List<String> DEFAULT_WINDOWS = List.of("08:00-18:00");
    private static final int SLOT_LENGTH_MINUTES = 120;

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final MongoTemplate mongoTemplate;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          UserRepository userRepository,
                          NotificationService notificationService,
                          MongoTemplate mongoTemplate) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.mongoTemplate = mongoTemplate;
    }

    public BookingDTO createBooking(String userEmail, BookingDTO dto) {
        User user = getUser(userEmail);
        Resource resource = getResource(dto.getResourceId());
        validateBookingWindow(dto, resource, userEmail, null, false);

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

        Booking saved = bookingRepository.save(booking);
        notifyAdminsOfNewBooking(saved);
        return toDTO(saved);
    }

    public List<BookingDTO> getMyBookings(String userEmail, String status, String resourceId, String bookingDate) {
        return readBookingDocuments().stream()
                .filter(Objects::nonNull)
                .filter(booking -> booking.getUserEmail() != null && booking.getUserEmail().equalsIgnoreCase(userEmail))
                .filter(booking -> matchesFilters(booking, status, resourceId, bookingDate))
                .sorted(Comparator.comparing(BookingDTO::getBookingDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed()
                        .thenComparing(BookingDTO::getStartTime, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(BookingDTO::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getAllBookings(String status, String resourceId, String bookingDate, String userEmail) {
        return readBookingDocuments().stream()
                .filter(Objects::nonNull)
                .filter(booking -> matchesFilters(booking, status, resourceId, bookingDate))
                .filter(booking -> userEmail == null || userEmail.isBlank()
                        || (booking.getUserEmail() != null
                        && booking.getUserEmail().toLowerCase(Locale.ROOT).contains(userEmail.toLowerCase(Locale.ROOT))))
                .sorted(Comparator.comparing(BookingDTO::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .collect(Collectors.toList());
    }

    public BookingAvailabilityDTO getAvailability(String resourceId, LocalDate bookingDate, String excludeBookingId) {
        Resource resource = getResource(resourceId);
        List<BookingDTO> activeBookings = readBookingDocuments().stream()
                .filter(Objects::nonNull)
                .filter(booking -> Objects.equals(booking.getResourceId(), resourceId))
                .filter(booking -> Objects.equals(booking.getBookingDate(), bookingDate))
                .filter(booking -> booking.getStatus() == Booking.BookingStatus.PENDING
                        || booking.getStatus() == Booking.BookingStatus.APPROVED)
                .filter(booking -> excludeBookingId == null || excludeBookingId.isBlank() || !excludeBookingId.equals(booking.getId()))
                .collect(Collectors.toList());

        BookingAvailabilityDTO dto = new BookingAvailabilityDTO();
        dto.setResourceId(resourceId);
        dto.setBookingDate(bookingDate);
        dto.setResourceCapacity(resource.getCapacity());
        dto.setSlots(buildSlotAvailability(resource, activeBookings));
        return dto;
    }

    public BookingDTO cancelBooking(String bookingId, String userEmail) {
        Booking booking = getBooking(bookingId);
        User actor = getUser(userEmail);
        boolean isAdmin = hasRole(actor, "ROLE_ADMIN");
        if (!isAdmin) {
            ensureOwner(booking, userEmail);
        }
        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled.");
        }
        if (booking.getStatus() == Booking.BookingStatus.REJECTED) {
            throw new RuntimeException("Rejected bookings cannot be cancelled.");
        }
        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setUpdatedAt(LocalDateTime.now());
        booking.setReviewedBy(userEmail);
        booking.setReviewedAt(LocalDateTime.now());
        booking.setAdminReason(isAdmin ? "Cancelled by admin" : "Cancelled by student");
        return toDTO(bookingRepository.save(booking));
    }

    public BookingDTO rescheduleBooking(String bookingId, String userEmail, BookingDTO dto) {
        Booking booking = getBooking(bookingId);
        ensureOwner(booking, userEmail);
        Resource resource = getResource(booking.getResourceId());

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new RuntimeException("Cancelled bookings cannot be rescheduled.");
        }

        validateBookingWindow(dto, resource, userEmail, booking.getId(), booking.getStatus() == Booking.BookingStatus.APPROVED);

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
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be approved.");
        }
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
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be rejected.");
        }
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

    private boolean matchesFilters(BookingDTO booking, String status, String resourceId, String bookingDate) {
        boolean matchesStatus = status == null || status.isBlank()
                || (booking.getStatus() != null && booking.getStatus().name().equalsIgnoreCase(status));
        boolean matchesResource = resourceId == null || resourceId.isBlank()
                || resourceId.equals(booking.getResourceId());
        boolean matchesDate = bookingDate == null || bookingDate.isBlank()
                || (booking.getBookingDate() != null && booking.getBookingDate().toString().equals(bookingDate));
        return matchesStatus && matchesResource && matchesDate;
    }

    private void validateBookingWindow(BookingDTO dto, Resource resource, String userEmail, String currentBookingId, boolean requireConflictCheck) {
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
        validateDuplicateUserBooking(userEmail, resource.getId(), dto.getBookingDate(), dto.getStartTime(), dto.getEndTime(), currentBookingId);
        if (requireConflictCheck || currentBookingId == null) {
            validateConflict(resource, dto.getBookingDate(), dto.getStartTime(), dto.getEndTime(),
                    dto.getExpectedAttendees(), currentBookingId);
        }
    }

    private void validateExistingBookingConflict(Booking booking, String currentBookingId) {
        Resource resource = getResource(booking.getResourceId());
        validateConflict(resource, booking.getBookingDate(), booking.getStartTime(), booking.getEndTime(),
                booking.getExpectedAttendees(), currentBookingId);
    }

    private void validateConflict(Resource resource,
                                  java.time.LocalDate bookingDate,
                                  java.time.LocalTime startTime,
                                  java.time.LocalTime endTime,
                                  Integer expectedAttendees,
                                  String currentBookingId) {
        List<Booking> overlappingBookings = bookingRepository.findByResourceIdAndBookingDate(resource.getId(), bookingDate).stream()
                .filter(existing -> existing.getStatus() == Booking.BookingStatus.APPROVED
                        || existing.getStatus() == Booking.BookingStatus.PENDING)
                .filter(existing -> currentBookingId == null || !existing.getId().equals(currentBookingId))
                .filter(existing -> startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime()))
                .collect(Collectors.toList());

        int requestedAttendees = expectedAttendees == null ? 1 : expectedAttendees;

        if (resource.getCapacity() <= 0) {
            if (!overlappingBookings.isEmpty()) {
                throw new RuntimeException("This resource already has a booking for the selected time range.");
            }
            return;
        }

        int occupiedCapacity = overlappingBookings.stream()
                .map(Booking::getExpectedAttendees)
                .filter(Objects::nonNull)
                .mapToInt(Integer::intValue)
                .sum();

        if (occupiedCapacity + requestedAttendees > resource.getCapacity()) {
            int remainingCapacity = Math.max(resource.getCapacity() - occupiedCapacity, 0);
            throw new RuntimeException("This time slot is full. Remaining capacity: " + remainingCapacity + ".");
        }
    }

    private boolean hasRole(User user, String role) {
        return user.getRoles() != null && user.getRoles().contains(role);
    }

    private List<BookingAvailabilityDTO.SlotAvailabilityDTO> buildSlotAvailability(Resource resource, List<BookingDTO> activeBookings) {
        List<String> windows = resource.getAvailabilityWindows();
        if (windows == null || windows.isEmpty()) {
            windows = DEFAULT_WINDOWS;
        }

        List<BookingAvailabilityDTO.SlotAvailabilityDTO> slots = new ArrayList<>();
        for (String window : windows) {
            if (window == null || !window.contains("-")) continue;
            String[] parts = window.split("-");
            LocalTime windowStart = safeParseTime(parts[0]);
            LocalTime windowEnd = safeParseTime(parts[1]);
            if (windowStart == null || windowEnd == null || !windowEnd.isAfter(windowStart)) continue;

            for (LocalTime slotStart = windowStart; !slotStart.plusMinutes(SLOT_LENGTH_MINUTES).isAfter(windowEnd); slotStart = slotStart.plusMinutes(SLOT_LENGTH_MINUTES)) {
                LocalTime slotEnd = slotStart.plusMinutes(SLOT_LENGTH_MINUTES);
                LocalTime currentSlotStart = slotStart;
                LocalTime currentSlotEnd = slotEnd;
                int occupiedCapacity = activeBookings.stream()
                        .filter(booking -> booking.getStartTime() != null && booking.getEndTime() != null)
                        .filter(booking -> overlaps(currentSlotStart, currentSlotEnd, booking.getStartTime(), booking.getEndTime()))
                        .map(BookingDTO::getExpectedAttendees)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .sum();

                int totalCapacity = Math.max(resource.getCapacity(), 0);
                int remainingCapacity = totalCapacity <= 0
                        ? (occupiedCapacity == 0 ? Integer.MAX_VALUE : 0)
                        : Math.max(totalCapacity - occupiedCapacity, 0);

                BookingAvailabilityDTO.SlotAvailabilityDTO slot = new BookingAvailabilityDTO.SlotAvailabilityDTO();
                slot.setStartTime(currentSlotStart.toString());
                slot.setEndTime(currentSlotEnd.toString());
                slot.setOccupiedCapacity(occupiedCapacity);
                slot.setRemainingCapacity(remainingCapacity);
                slot.setAvailable(totalCapacity <= 0 ? occupiedCapacity == 0 : remainingCapacity > 0);
                slots.add(slot);
            }
        }
        return slots;
    }

    private List<BookingDTO> readBookingDocuments() {
        return mongoTemplate.findAll(Document.class, "bookings").stream()
                .map(this::toDTO)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private BookingDTO toDTO(Document doc) {
        try {
            BookingDTO dto = new BookingDTO();
            dto.setId(asString(doc.get("_id")));
            dto.setResourceId(asString(doc.get("resourceId")));
            dto.setResourceName(asString(doc.get("resourceName")));
            dto.setUserId(asString(doc.get("userId")));
            dto.setUserName(asString(doc.get("userName")));
            dto.setUserEmail(asString(doc.get("userEmail")));
            dto.setBookingDate(asLocalDate(doc.get("bookingDate")));
            dto.setStartTime(asLocalTime(doc.get("startTime")));
            dto.setEndTime(asLocalTime(doc.get("endTime")));
            dto.setPurpose(asString(doc.get("purpose")));
            dto.setExpectedAttendees(asInteger(doc.get("expectedAttendees")));
            dto.setStatus(asBookingStatus(doc.get("status")));
            dto.setAdminReason(asString(doc.get("adminReason")));
            dto.setReviewedBy(asString(doc.get("reviewedBy")));
            dto.setReviewedAt(asLocalDateTime(doc.get("reviewedAt")));
            dto.setCreatedAt(asLocalDateTime(doc.get("createdAt")));
            dto.setUpdatedAt(asLocalDateTime(doc.get("updatedAt")));
            return dto;
        } catch (Exception ex) {
            return null;
        }
    }

    private String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Integer asInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value instanceof String text && !text.isBlank()) {
            return Integer.parseInt(text);
        }
        return null;
    }

    private LocalDate asLocalDate(Object value) {
        if (value instanceof LocalDate localDate) {
            return localDate;
        }
        if (value instanceof Date date) {
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return LocalDate.parse(text);
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        return null;
    }

    private LocalTime asLocalTime(Object value) {
        if (value instanceof LocalTime localTime) {
            return localTime;
        }
        if (value instanceof Date date) {
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalTime();
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return LocalTime.parse(text);
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        return null;
    }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof LocalDateTime localDateTime) {
            return localDateTime;
        }
        if (value instanceof Date date) {
            return date.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return LocalDateTime.parse(text);
            } catch (DateTimeParseException ignored) {
                return null;
            }
        }
        return null;
    }

    private Booking.BookingStatus asBookingStatus(Object value) {
        if (value instanceof Booking.BookingStatus status) {
            return status;
        }
        if (value instanceof String text && !text.isBlank()) {
            try {
                return Booking.BookingStatus.valueOf(text.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException ignored) {
                if ("CANCELED".equalsIgnoreCase(text)) {
                    return Booking.BookingStatus.CANCELLED;
                }
            }
        }
        return Booking.BookingStatus.PENDING;
    }

    private LocalTime safeParseTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            return null;
        }
    }

    private boolean overlaps(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        return startA.isBefore(endB) && endA.isAfter(startB);
    }

    private void validateDuplicateUserBooking(String userEmail,
                                              String resourceId,
                                              java.time.LocalDate bookingDate,
                                              java.time.LocalTime startTime,
                                              java.time.LocalTime endTime,
                                              String currentBookingId) {
        boolean hasDuplicate = bookingRepository.findByUserEmailOrderByCreatedAtDesc(userEmail).stream()
                .filter(existing -> existing.getStatus() == Booking.BookingStatus.PENDING
                        || existing.getStatus() == Booking.BookingStatus.APPROVED)
                .filter(existing -> currentBookingId == null || !existing.getId().equals(currentBookingId))
                .filter(existing -> Objects.equals(existing.getResourceId(), resourceId))
                .filter(existing -> Objects.equals(existing.getBookingDate(), bookingDate))
                .anyMatch(existing -> startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime()));

        if (hasDuplicate) {
            throw new RuntimeException("You already have an active booking request for this resource and time slot.");
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

    private void notifyAdminsOfNewBooking(Booking booking) {
        Set<String> adminEmails = userRepository.findAll().stream()
                .filter(user -> user.getRoles() != null && user.getRoles().contains("ROLE_ADMIN"))
                .map(User::getEmail)
                .collect(Collectors.toSet());

        for (String adminEmail : adminEmails) {
            notificationService.createNotification(adminEmail,
                    "BOOKING_REQUESTED",
                    "New Booking Request",
                    "A new booking request was created for " + booking.getResourceName() +
                            " on " + booking.getBookingDate() + ".",
                    booking.getId(),
                    "BOOKING");
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
