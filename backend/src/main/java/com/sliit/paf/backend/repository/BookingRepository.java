package com.sliit.paf.backend.repository;

import com.sliit.paf.backend.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    List<Booking> findByBookingDateOrderByStartTimeAsc(LocalDate bookingDate);
    List<Booking> findByResourceIdAndBookingDate(String resourceId, LocalDate bookingDate);
}
