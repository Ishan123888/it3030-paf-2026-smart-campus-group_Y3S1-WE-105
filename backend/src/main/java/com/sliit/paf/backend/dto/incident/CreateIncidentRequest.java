package com.sliit.paf.backend.dto.incident;

import com.sliit.paf.backend.models.Incident;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateIncidentRequest {
    @NotNull(message = "Category is required")
    private Incident.IncidentCategory category;

    @NotBlank(message = "Description is required")
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    private String description;

    @NotNull(message = "Priority is required")
    private Incident.IncidentPriority priority;

    @NotBlank(message = "Location is required")
    @Size(max = 150, message = "Location must be less than 150 characters")
    private String location;

    private String resourceId;
    private String resourceName;

    @NotBlank(message = "Preferred contact name is required")
    private String preferredContactName;
    @NotBlank(message = "Preferred contact email is required")
    private String preferredContactEmail;
    @NotBlank(message = "Preferred contact phone is required")
    private String preferredContactPhone;

    public Incident.IncidentCategory getCategory() { return category; }
    public void setCategory(Incident.IncidentCategory category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Incident.IncidentPriority getPriority() { return priority; }
    public void setPriority(Incident.IncidentPriority priority) { this.priority = priority; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getResourceId() { return resourceId; }
    public void setResourceId(String resourceId) { this.resourceId = resourceId; }
    public String getResourceName() { return resourceName; }
    public void setResourceName(String resourceName) { this.resourceName = resourceName; }
    public String getPreferredContactName() { return preferredContactName; }
    public void setPreferredContactName(String preferredContactName) { this.preferredContactName = preferredContactName; }
    public String getPreferredContactEmail() { return preferredContactEmail; }
    public void setPreferredContactEmail(String preferredContactEmail) { this.preferredContactEmail = preferredContactEmail; }
    public String getPreferredContactPhone() { return preferredContactPhone; }
    public void setPreferredContactPhone(String preferredContactPhone) { this.preferredContactPhone = preferredContactPhone; }
}

