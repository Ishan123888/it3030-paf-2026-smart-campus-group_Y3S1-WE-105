package com.sliit.paf.backend.dto.incident;

import com.sliit.paf.backend.models.Incident;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class IncidentDTO {
    private String id;
    private String ticketNumber;
    private Incident.IncidentCategory category;
    private String description;
    private Incident.IncidentPriority priority;
    private Incident.IncidentStatus status;
    private String location;
    private String resourceId;
    private String resourceName;
    private String preferredContactName;
    private String preferredContactEmail;
    private String preferredContactPhone;
    private String createdByUserId;
    private String createdByEmail;
    private String createdByName;
    private String assignedToUserId;
    private String assignedToEmail;
    private String assignedToName;
    private String resolutionNotes;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private List<AttachmentDTO> attachments;
    private List<CommentDTO> comments;
    private List<AuditLogDTO> auditLogs;

    public static IncidentDTO fromModel(Incident incident) {
        IncidentDTO dto = new IncidentDTO();
        dto.id = incident.getId();
        dto.ticketNumber = incident.getTicketNumber();
        dto.category = incident.getCategory();
        dto.description = incident.getDescription();
        dto.priority = incident.getPriority();
        dto.status = incident.getStatus();
        dto.location = incident.getLocation();
        dto.resourceId = incident.getResourceId();
        dto.resourceName = incident.getResourceName();
        dto.preferredContactName = incident.getPreferredContactName();
        dto.preferredContactEmail = incident.getPreferredContactEmail();
        dto.preferredContactPhone = incident.getPreferredContactPhone();
        dto.createdByUserId = incident.getCreatedByUserId();
        dto.createdByEmail = incident.getCreatedByEmail();
        dto.createdByName = incident.getCreatedByName();
        dto.assignedToUserId = incident.getAssignedToUserId();
        dto.assignedToEmail = incident.getAssignedToEmail();
        dto.assignedToName = incident.getAssignedToName();
        dto.resolutionNotes = incident.getResolutionNotes();
        dto.rejectionReason = incident.getRejectionReason();
        dto.createdAt = incident.getCreatedAt();
        dto.updatedAt = incident.getUpdatedAt();
        dto.resolvedAt = incident.getResolvedAt();
        dto.closedAt = incident.getClosedAt();
        dto.attachments = incident.getAttachments().stream().map(AttachmentDTO::fromModel).collect(Collectors.toList());
        dto.comments = incident.getComments().stream().map(CommentDTO::fromModel).collect(Collectors.toList());
        dto.auditLogs = incident.getAuditLogs().stream().map(AuditLogDTO::fromModel).collect(Collectors.toList());
        return dto;
    }

    public String getId() { return id; }
    public String getTicketNumber() { return ticketNumber; }
    public Incident.IncidentCategory getCategory() { return category; }
    public String getDescription() { return description; }
    public Incident.IncidentPriority getPriority() { return priority; }
    public Incident.IncidentStatus getStatus() { return status; }
    public String getLocation() { return location; }
    public String getResourceId() { return resourceId; }
    public String getResourceName() { return resourceName; }
    public String getPreferredContactName() { return preferredContactName; }
    public String getPreferredContactEmail() { return preferredContactEmail; }
    public String getPreferredContactPhone() { return preferredContactPhone; }
    public String getCreatedByUserId() { return createdByUserId; }
    public String getCreatedByEmail() { return createdByEmail; }
    public String getCreatedByName() { return createdByName; }
    public String getAssignedToUserId() { return assignedToUserId; }
    public String getAssignedToEmail() { return assignedToEmail; }
    public String getAssignedToName() { return assignedToName; }
    public String getResolutionNotes() { return resolutionNotes; }
    public String getRejectionReason() { return rejectionReason; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public LocalDateTime getClosedAt() { return closedAt; }
    public List<AttachmentDTO> getAttachments() { return attachments; }
    public List<CommentDTO> getComments() { return comments; }
    public List<AuditLogDTO> getAuditLogs() { return auditLogs; }

    public static class AttachmentDTO {
        private String fileId;
        private String fileName;
        private String url;

        public static AttachmentDTO fromModel(Incident.Attachment model) {
            AttachmentDTO dto = new AttachmentDTO();
            dto.fileId = model.getFileId();
            dto.fileName = model.getFileName();
            dto.url = model.getUrl();
            return dto;
        }

        public String getFileId() { return fileId; }
        public String getFileName() { return fileName; }
        public String getUrl() { return url; }
    }

    public static class CommentDTO {
        private String id;
        private String content;
        private String createdByUserId;
        private String createdByEmail;
        private String createdByName;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static CommentDTO fromModel(Incident.Comment model) {
            CommentDTO dto = new CommentDTO();
            dto.id = model.getId();
            dto.content = model.getContent();
            dto.createdByUserId = model.getCreatedByUserId();
            dto.createdByEmail = model.getCreatedByEmail();
            dto.createdByName = model.getCreatedByName();
            dto.createdAt = model.getCreatedAt();
            dto.updatedAt = model.getUpdatedAt();
            return dto;
        }

        public String getId() { return id; }
        public String getContent() { return content; }
        public String getCreatedByUserId() { return createdByUserId; }
        public String getCreatedByEmail() { return createdByEmail; }
        public String getCreatedByName() { return createdByName; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
    }

    public static class AuditLogDTO {
        private String id;
        private String action;
        private String actorEmail;
        private String actorName;
        private String details;
        private LocalDateTime createdAt;

        public static AuditLogDTO fromModel(Incident.AuditLog model) {
            AuditLogDTO dto = new AuditLogDTO();
            dto.id = model.getId();
            dto.action = model.getAction();
            dto.actorEmail = model.getActorEmail();
            dto.actorName = model.getActorName();
            dto.details = model.getDetails();
            dto.createdAt = model.getCreatedAt();
            return dto;
        }

        public String getId() { return id; }
        public String getAction() { return action; }
        public String getActorEmail() { return actorEmail; }
        public String getActorName() { return actorName; }
        public String getDetails() { return details; }
        public LocalDateTime getCreatedAt() { return createdAt; }
    }
}

