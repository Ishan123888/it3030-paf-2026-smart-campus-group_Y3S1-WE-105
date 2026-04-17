package com.sliit.paf.backend.models;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Location is required")
    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;

    private String description;

    private ResourceStatus status = ResourceStatus.ACTIVE;

    // Availability windows e.g. ["08:00-12:00", "13:00-17:00"]
    private List<String> availabilityWindows;

    // Resource images (base64 data URLs or external URLs), up to 5
    private List<String> images;

    private double pricePerHour;

    private String currency = "LKR"; // "LKR" or "USD"

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────────────────

    public enum ResourceType {
        // Facilities (Brand 1)
        LECTURE_HALL,
        LAB,
        MEETING_ROOM,
        // Equipment (Brand 2)
        PROJECTOR,
        CAMERA,
        LAPTOP,
        MICROPHONE,
        SMART_BOARD,
        // Utilities (Brand 3)
        WATER_FILTER,
        CHAIR,
        TABLE,
        AC
    }

    public enum ResourceStatus {
        ACTIVE,
        OUT_OF_SERVICE
    }

    // ── Constructors ───────────────────────────────────────────────────────────

    public Resource() {}

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public ResourceType getType() { return type; }
    public void setType(ResourceType type) { this.type = type; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public ResourceStatus getStatus() { return status; }
    public void setStatus(ResourceStatus status) { this.status = status; }

    public List<String> getAvailabilityWindows() { return availabilityWindows; }
    public void setAvailabilityWindows(List<String> availabilityWindows) { this.availabilityWindows = availabilityWindows; }

    public double getPricePerHour() { return pricePerHour; }
    public void setPricePerHour(double pricePerHour) { this.pricePerHour = pricePerHour; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public List<String> getImages() { return images; }
    public void setImages(List<String> images) { this.images = images; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
