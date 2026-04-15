package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.dto.BookingDTO;
import com.sliit.paf.backend.services.BookingService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingDTO>> getMyBookings(
            Principal principal,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String bookingDate) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(bookingService.getMyBookings(principal.getName(), status, resourceId, bookingDate));
    }

    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(Principal principal, @Valid @RequestBody BookingDTO dto) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(principal.getName(), dto));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingDTO> cancelBooking(@PathVariable String id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(bookingService.cancelBooking(id, principal.getName()));
    }

    @PutMapping("/{id}/reschedule")
    public ResponseEntity<BookingDTO> rescheduleBooking(
            @PathVariable String id,
            Principal principal,
            @Valid @RequestBody BookingDTO dto) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(bookingService.rescheduleBooking(id, principal.getName(), dto));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BookingDTO>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String resourceId,
            @RequestParam(required = false) String bookingDate,
            @RequestParam(required = false) String userEmail) {
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId, bookingDate, userEmail));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> approveBooking(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(bookingService.approveBooking(id, principal.getName()));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> rejectBooking(
            @PathVariable String id,
            Principal principal,
            @Valid @RequestBody RejectBookingRequest request) {
        return ResponseEntity.ok(bookingService.rejectBooking(id, principal.getName(), request.getReason()));
    }

    public static class RejectBookingRequest {
        @NotBlank(message = "Reason is required")
        private String reason;

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
