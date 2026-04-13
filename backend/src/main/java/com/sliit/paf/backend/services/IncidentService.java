package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.incident.*;
import com.sliit.paf.backend.models.Incident;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.IncidentRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ImageKitService imageKitService;

    public IncidentService(IncidentRepository incidentRepository,
                           UserRepository userRepository,
                           NotificationService notificationService,
                           ImageKitService imageKitService) {
        this.incidentRepository = incidentRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.imageKitService = imageKitService;
    }

    public IncidentDTO createIncident(CreateIncidentRequest req, List<MultipartFile> attachments, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        if (attachments != null && attachments.size() > 3) {
            throw new RuntimeException("Maximum 3 attachments are allowed");
        }

        Incident incident = new Incident();
        incident.setTicketNumber(generateTicketNumber());
        incident.setCategory(req.getCategory());
        incident.setDescription(req.getDescription().trim());
        incident.setPriority(req.getPriority());
        incident.setLocation(req.getLocation().trim());
        incident.setResourceId(trimOrNull(req.getResourceId()));
        incident.setResourceName(trimOrNull(req.getResourceName()));
        incident.setPreferredContactName(req.getPreferredContactName().trim());
        incident.setPreferredContactEmail(req.getPreferredContactEmail().trim());
        incident.setPreferredContactPhone(req.getPreferredContactPhone().trim());
        incident.setCreatedByUserId(actor.getId());
        incident.setCreatedByEmail(actor.getEmail());
        incident.setCreatedByName(actor.getName());

        if (attachments != null && !attachments.isEmpty()) {
            incident.setAttachments(imageKitService.uploadIncidentAttachments(attachments));
        }

        addAudit(incident, "TICKET_CREATED", actor, "Incident ticket created");

        return IncidentDTO.fromModel(incidentRepository.save(incident));
    }

    public List<IncidentDTO> getVisibleIncidents(String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        List<Incident> tickets;
        if (isPrivileged(actor)) {
            tickets = incidentRepository.findAll().stream()
                    .sorted(Comparator.comparing(Incident::getUpdatedAt).reversed())
                    .collect(Collectors.toList());
        } else if (hasRole(actor, "ROLE_TECHNICIAN")) {
            Map<String, Incident> merged = new HashMap<>();
            incidentRepository.findByCreatedByUserIdOrderByCreatedAtDesc(actor.getId())
                    .forEach(ticket -> merged.put(ticket.getId(), ticket));
            incidentRepository.findByAssignedToUserIdOrderByUpdatedAtDesc(actor.getId())
                    .forEach(ticket -> merged.put(ticket.getId(), ticket));
            tickets = merged.values().stream()
                    .sorted(Comparator.comparing(Incident::getUpdatedAt).reversed())
                    .collect(Collectors.toList());
        } else {
            tickets = incidentRepository.findByCreatedByUserIdOrderByCreatedAtDesc(actor.getId());
        }
        return tickets.stream().map(IncidentDTO::fromModel).collect(Collectors.toList());
    }

    public IncidentDTO getIncidentById(String id, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = getIncident(id);
        assertCanView(incident, actor);
        return IncidentDTO.fromModel(incident);
    }

    public IncidentDTO assignIncident(String id, AssignIncidentRequest req, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        if (!hasAnyRole(actor, Set.of("ROLE_ADMIN", "ROLE_STAFF"))) {
            throw new RuntimeException("Unauthorized: only ADMIN or STAFF can assign incident tickets");
        }

        Incident incident = getIncident(id);
        User assignee = getUserByEmail(req.getAssigneeEmail());
        if (!hasAnyRole(assignee, Set.of("ROLE_TECHNICIAN", "ROLE_STAFF"))) {
            throw new RuntimeException("Assignee must have ROLE_TECHNICIAN or ROLE_STAFF");
        }

        incident.setAssignedToUserId(assignee.getId());
        incident.setAssignedToEmail(assignee.getEmail());
        incident.setAssignedToName(assignee.getName());
        incident.setUpdatedAt(LocalDateTime.now());
        addAudit(incident, "ASSIGNED", actor, "Assigned to " + assignee.getEmail());

        Incident saved = incidentRepository.save(incident);

        notificationService.createNotification(
                assignee.getEmail(),
                "TICKET_ASSIGNED",
                "New Incident Assignment",
                "You were assigned to incident " + saved.getTicketNumber(),
                saved.getId(),
                "TICKET"
        );
        return IncidentDTO.fromModel(saved);
    }

    public IncidentDTO updateStatus(String id, UpdateIncidentStatusRequest req, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = getIncident(id);
        assertCanView(incident, actor);

        Incident.IncidentStatus current = incident.getStatus();
        Incident.IncidentStatus target = req.getStatus();
        validateTransition(current, target, actor, incident, req);

        incident.setStatus(target);
        incident.setUpdatedAt(LocalDateTime.now());

        if (target == Incident.IncidentStatus.RESOLVED) {
            incident.setResolutionNotes(trimOrNull(req.getResolutionNotes()));
            incident.setResolvedAt(LocalDateTime.now());
        }
        if (target == Incident.IncidentStatus.CLOSED) {
            incident.setClosedAt(LocalDateTime.now());
        }
        if (target == Incident.IncidentStatus.REJECTED) {
            incident.setRejectionReason(req.getRejectionReason().trim());
        }

        addAudit(incident, "STATUS_CHANGED", actor, current + " -> " + target);
        Incident saved = incidentRepository.save(incident);

        if (!saved.getCreatedByEmail().equals(actor.getEmail())) {
            notificationService.notifyTicketStatusChanged(saved.getCreatedByEmail(), saved.getId(), target.name());
        }

        return IncidentDTO.fromModel(saved);
    }

    public IncidentDTO addComment(String incidentId, CommentRequest req, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = getIncident(incidentId);
        assertCanView(incident, actor);

        Incident.Comment comment = new Incident.Comment();
        comment.setContent(req.getContent().trim());
        comment.setCreatedByUserId(actor.getId());
        comment.setCreatedByEmail(actor.getEmail());
        comment.setCreatedByName(actor.getName());
        comment.setCreatedAt(LocalDateTime.now());
        comment.setUpdatedAt(LocalDateTime.now());

        incident.getComments().add(comment);
        incident.setUpdatedAt(LocalDateTime.now());
        addAudit(incident, "COMMENT_ADDED", actor, "Comment added");
        Incident saved = incidentRepository.save(incident);

        if (!saved.getCreatedByEmail().equals(actorEmail)) {
            notificationService.notifyNewComment(saved.getCreatedByEmail(), saved.getId());
        }
        return IncidentDTO.fromModel(saved);
    }

    public IncidentDTO updateComment(String incidentId, String commentId, CommentRequest req, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = getIncident(incidentId);
        Incident.Comment comment = getComment(incident, commentId);

        if (!comment.getCreatedByEmail().equals(actorEmail) && !hasRole(actor, "ROLE_ADMIN")) {
            throw new RuntimeException("Unauthorized: you can only edit your own comments");
        }

        comment.setContent(req.getContent().trim());
        comment.setUpdatedAt(LocalDateTime.now());
        incident.setUpdatedAt(LocalDateTime.now());
        addAudit(incident, "COMMENT_UPDATED", actor, "Comment updated");
        return IncidentDTO.fromModel(incidentRepository.save(incident));
    }

    public IncidentDTO deleteComment(String incidentId, String commentId, String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        Incident incident = getIncident(incidentId);
        Incident.Comment comment = getComment(incident, commentId);

        if (!comment.getCreatedByEmail().equals(actorEmail) && !hasRole(actor, "ROLE_ADMIN")) {
            throw new RuntimeException("Unauthorized: you can only delete your own comments");
        }

        incident.setComments(incident.getComments().stream()
                .filter(c -> !c.getId().equals(commentId))
                .collect(Collectors.toList()));
        incident.setUpdatedAt(LocalDateTime.now());
        addAudit(incident, "COMMENT_DELETED", actor, "Comment deleted");
        return IncidentDTO.fromModel(incidentRepository.save(incident));
    }

    public List<AssigneeDTO> getAssignableUsers(String actorEmail) {
        User actor = getUserByEmail(actorEmail);
        if (!hasAnyRole(actor, Set.of("ROLE_ADMIN", "ROLE_STAFF"))) {
            return List.of();
        }

        return userRepository.findAll().stream()
                .filter(User::isActive)
                .filter(user -> hasAnyRole(user, Set.of("ROLE_TECHNICIAN", "ROLE_STAFF")))
                .map(AssigneeDTO::fromModel)
                .collect(Collectors.toList());
    }

    private Incident getIncident(String id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident ticket not found: " + id));
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    private void assertCanView(Incident incident, User actor) {
        boolean canView = isPrivileged(actor)
                || incident.getCreatedByEmail().equals(actor.getEmail())
                || (incident.getAssignedToEmail() != null && incident.getAssignedToEmail().equals(actor.getEmail()));
        if (!canView) throw new RuntimeException("Unauthorized to view this incident ticket");
    }

    private void validateTransition(Incident.IncidentStatus current,
                                    Incident.IncidentStatus target,
                                    User actor,
                                    Incident incident,
                                    UpdateIncidentStatusRequest req) {
        if (current == target) return;
        if (current == Incident.IncidentStatus.CLOSED || current == Incident.IncidentStatus.REJECTED) {
            throw new RuntimeException("Cannot change status of a closed/rejected ticket");
        }

        if (target == Incident.IncidentStatus.REJECTED) {
            if (!hasRole(actor, "ROLE_ADMIN")) {
                throw new RuntimeException("Unauthorized: only ADMIN can reject tickets");
            }
            if (req.getRejectionReason() == null || req.getRejectionReason().isBlank()) {
                throw new RuntimeException("Rejection reason is required");
            }
            return;
        }

        if (current == Incident.IncidentStatus.OPEN && target != Incident.IncidentStatus.IN_PROGRESS) {
            throw new RuntimeException("Invalid transition. OPEN can only move to IN_PROGRESS");
        }
        if (current == Incident.IncidentStatus.IN_PROGRESS && target != Incident.IncidentStatus.RESOLVED) {
            throw new RuntimeException("Invalid transition. IN_PROGRESS can only move to RESOLVED");
        }
        if (current == Incident.IncidentStatus.RESOLVED && target != Incident.IncidentStatus.CLOSED) {
            throw new RuntimeException("Invalid transition. RESOLVED can only move to CLOSED");
        }

        if (target == Incident.IncidentStatus.CLOSED) {
            boolean canClose = isPrivileged(actor) || incident.getCreatedByEmail().equals(actor.getEmail());
            if (!canClose) throw new RuntimeException("Unauthorized: only ticket owner or staff can close");
            return;
        }

        boolean canWork = isPrivileged(actor)
                || (incident.getAssignedToEmail() != null && incident.getAssignedToEmail().equals(actor.getEmail()));
        if (!canWork) throw new RuntimeException("Unauthorized to update ticket status");

        if (target == Incident.IncidentStatus.RESOLVED
                && (req.getResolutionNotes() == null || req.getResolutionNotes().isBlank())) {
            throw new RuntimeException("Resolution notes are required when marking as RESOLVED");
        }
    }

    private Incident.Comment getComment(Incident incident, String commentId) {
        return incident.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));
    }

    private void addAudit(Incident incident, String action, User actor, String details) {
        incident.getAuditLogs().add(new Incident.AuditLog(action, actor.getEmail(), actor.getName(), details));
    }

    private String trimOrNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private String generateTicketNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int random = new Random().nextInt(9000) + 1000;
        return "INC-" + date + "-" + random;
    }

    private boolean isPrivileged(User user) {
        Set<String> privileged = Set.of("ROLE_ADMIN", "ROLE_STAFF", "ROLE_MANAGER");
        return hasAnyRole(user, privileged);
    }

    private boolean hasRole(User user, String role) {
        return user.getRoles() != null && user.getRoles().contains(role);
    }

    private boolean hasAnyRole(User user, Set<String> roles) {
        if (user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(roles::contains);
    }
}
