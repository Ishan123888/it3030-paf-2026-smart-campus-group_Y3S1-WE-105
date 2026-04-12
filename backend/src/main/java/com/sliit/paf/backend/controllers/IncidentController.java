package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.dto.incident.*;
import com.sliit.paf.backend.services.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public ResponseEntity<List<IncidentDTO>> getVisibleIncidents(Principal principal) {
        return ResponseEntity.ok(incidentService.getVisibleIncidents(principal.getName()));
    }

    @GetMapping("/assignees")
    public ResponseEntity<List<AssigneeDTO>> getAssignableUsers(Principal principal) {
        return ResponseEntity.ok(incidentService.getAssignableUsers(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentDTO> getIncidentById(@PathVariable String id, Principal principal) {
        return ResponseEntity.ok(incidentService.getIncidentById(id, principal.getName()));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentDTO> createIncident(
            @Valid @ModelAttribute CreateIncidentRequest request,
            @RequestParam(value = "attachments", required = false) List<MultipartFile> attachments,
            Principal principal) {
        return ResponseEntity.ok(incidentService.createIncident(request, attachments, principal.getName()));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<IncidentDTO> assignIncident(
            @PathVariable String id,
            @Valid @RequestBody AssignIncidentRequest request,
            Principal principal) {
        return ResponseEntity.ok(incidentService.assignIncident(id, request, principal.getName()));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<IncidentDTO> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateIncidentStatusRequest request,
            Principal principal) {
        return ResponseEntity.ok(incidentService.updateStatus(id, request, principal.getName()));
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<IncidentDTO> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            Principal principal) {
        return ResponseEntity.ok(incidentService.addComment(id, request, principal.getName()));
    }

    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<IncidentDTO> updateComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @Valid @RequestBody CommentRequest request,
            Principal principal) {
        return ResponseEntity.ok(incidentService.updateComment(id, commentId, request, principal.getName()));
    }

    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            Principal principal) {
        incidentService.deleteComment(id, commentId, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Comment deleted successfully"));
    }
}
