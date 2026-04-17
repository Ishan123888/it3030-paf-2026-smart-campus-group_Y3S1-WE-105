package com.sliit.paf.backend.dto;

import com.sliit.paf.backend.models.Resource;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class ResourceDTO {

    private String id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private Resource.ResourceType type;

    @NotBlank(message = "Brand is required")
    private String brand;

    @NotBlank(message = "Location is required")
    private String location;

    @Min(value = 1, message = "Capacity must be at least 1")
    private int capacity;

    private String description;

    private Resource.ResourceStatus status;

    private List<String> availabilityWindows;

    private List<String> images;

    private double pricePerHour;

    private String currency = "LKR";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ResourceDTO() {}

    // ── Getters & Setters ──────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Resource.ResourceType getType() { return type; }
    public void setType(Resource.ResourceType type) { this.type = type; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Resource.ResourceStatus getStatus() { return status; }
    public void setStatus(Resource.ResourceStatus status) { this.status = status; }

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
