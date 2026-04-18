package com.sliit.paf.backend.dto;

import java.time.LocalDate;
import java.util.List;

public class BookingAvailabilityDTO {

    private String resourceId;
    private LocalDate bookingDate;
    private Integer resourceCapacity;
    private List<SlotAvailabilityDTO> slots;

    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }

    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }

    public Integer getResourceCapacity() { return resourceCapacity; }
    public void setResourceCapacity(Integer resourceCapacity) { this.resourceCapacity = resourceCapacity; }

    public List<SlotAvailabilityDTO> getSlots() { return slots; }
    public void setSlots(List<SlotAvailabilityDTO> slots) { this.slots = slots; }

    public static class SlotAvailabilityDTO {
        private String startTime;
        private String endTime;
        private Integer occupiedCapacity;
        private Integer remainingCapacity;
        private boolean available;

        public String getStartTime() { return startTime; }
        public void setStartTime(String startTime) { this.startTime = startTime; }

        public String getEndTime() { return endTime; }
        public void setEndTime(String endTime) { this.endTime = endTime; }

        public Integer getOccupiedCapacity() { return occupiedCapacity; }
        public void setOccupiedCapacity(Integer occupiedCapacity) { this.occupiedCapacity = occupiedCapacity; }

        public Integer getRemainingCapacity() { return remainingCapacity; }
        public void setRemainingCapacity(Integer remainingCapacity) { this.remainingCapacity = remainingCapacity; }

        public boolean isAvailable() { return available; }
        public void setAvailable(boolean available) { this.available = available; }
    }
}
