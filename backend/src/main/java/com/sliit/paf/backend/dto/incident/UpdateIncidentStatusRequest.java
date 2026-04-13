package com.sliit.paf.backend.dto.incident;

import com.sliit.paf.backend.models.Incident;
import jakarta.validation.constraints.NotNull;

public class UpdateIncidentStatusRequest {
    @NotNull(message = "Status is required")
    private Incident.IncidentStatus status;

    private String resolutionNotes;
    private String rejectionReason;

    public Incident.IncidentStatus getStatus() { return status; }
    public void setStatus(Incident.IncidentStatus status) { this.status = status; }
    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}

