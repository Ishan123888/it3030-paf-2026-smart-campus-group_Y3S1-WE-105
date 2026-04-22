package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.incident.*;
import com.sliit.paf.backend.models.Incident;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.IncidentRepository;
import com.sliit.paf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for IncidentService — Member 3
 */
@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock private IncidentRepository incidentRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @Mock private ImageKitService imageKitService;

    @InjectMocks private IncidentService incidentService;

    private User adminUser;
    private User regularUser;
    private User techUser;
    private Incident testIncident;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId("admin-001");
        adminUser.setEmail("admin@test.com");
        adminUser.setName("Admin User");
        adminUser.setRoles(Set.of("ROLE_ADMIN"));
        adminUser.setActive(true);

        regularUser = new User();
        regularUser.setId("user-001");
        regularUser.setEmail("user@test.com");
        regularUser.setName("Regular User");
        regularUser.setRoles(Set.of("ROLE_USER"));
        regularUser.setActive(true);

        techUser = new User();
        techUser.setId("tech-001");
        techUser.setEmail("tech@test.com");
        techUser.setName("Technician");
        techUser.setRoles(Set.of("ROLE_TECHNICIAN"));
        techUser.setActive(true);

        testIncident = new Incident();
        testIncident.setId("inc-001");
        testIncident.setTicketNumber("INC-20260101-1234");
        testIncident.setCategory(Incident.IncidentCategory.EQUIPMENT);
        testIncident.setDescription("Projector not working");
        testIncident.setPriority(Incident.IncidentPriority.HIGH);
        testIncident.setLocation("Room 101");
        testIncident.setStatus(Incident.IncidentStatus.OPEN);
        testIncident.setCreatedByUserId("user-001");
        testIncident.setCreatedByEmail("user@test.com");
        testIncident.setCreatedByName("Regular User");
        testIncident.setPreferredContactName("Regular User");
        testIncident.setPreferredContactEmail("user@test.com");
        testIncident.setPreferredContactPhone("0771234567");
        testIncident.setComments(new ArrayList<>());
        testIncident.setAuditLogs(new ArrayList<>());
        testIncident.setCreatedAt(LocalDateTime.now());
        testIncident.setUpdatedAt(LocalDateTime.now());
    }

    // ── getVisibleIncidents ────────────────────────────────────────────────────

    @Test
    @DisplayName("getVisibleIncidents — admin sees all incidents")
    void getVisibleIncidents_adminSeesAll() {
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(incidentRepository.findAll()).thenReturn(List.of(testIncident));

        List<IncidentDTO> result = incidentService.getVisibleIncidents("admin@test.com");

        assertThat(result).hasSize(1);
        verify(incidentRepository).findAll();
    }

    @Test
    @DisplayName("getVisibleIncidents — regular user sees only own incidents")
    void getVisibleIncidents_userSeesOwn() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(regularUser));
        when(incidentRepository.findByCreatedByUserIdOrderByCreatedAtDesc("user-001"))
                .thenReturn(List.of(testIncident));

        List<IncidentDTO> result = incidentService.getVisibleIncidents("user@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getCreatedByEmail()).isEqualTo("user@test.com");
    }

    // ── getIncidentById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getIncidentById — owner can view their incident")
    void getIncidentById_ownerCanView() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(regularUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));

        IncidentDTO result = incidentService.getIncidentById("inc-001", "user@test.com");

        assertThat(result.getId()).isEqualTo("inc-001");
        assertThat(result.getDescription()).isEqualTo("Projector not working");
    }

    @Test
    @DisplayName("getIncidentById — unauthorized user cannot view")
    void getIncidentById_unauthorizedCannotView() {
        User stranger = new User();
        stranger.setId("stranger-001");
        stranger.setEmail("stranger@test.com");
        stranger.setRoles(Set.of("ROLE_USER"));

        when(userRepository.findByEmail("stranger@test.com")).thenReturn(Optional.of(stranger));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));

        assertThatThrownBy(() -> incidentService.getIncidentById("inc-001", "stranger@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    // ── assignIncident ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("assignIncident — admin can assign to technician")
    void assignIncident_adminCanAssign() {
        AssignIncidentRequest req = new AssignIncidentRequest();
        req.setAssigneeEmail("tech@test.com");

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(userRepository.findByEmail("tech@test.com")).thenReturn(Optional.of(techUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));
        when(incidentRepository.save(any())).thenReturn(testIncident);

        incidentService.assignIncident("inc-001", req, "admin@test.com");

        verify(incidentRepository).save(any(Incident.class));
        verify(notificationService).createNotification(eq("tech@test.com"), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("assignIncident — regular user cannot assign")
    void assignIncident_regularUserCannotAssign() {
        AssignIncidentRequest req = new AssignIncidentRequest();
        req.setAssigneeEmail("tech@test.com");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(regularUser));

        assertThatThrownBy(() -> incidentService.assignIncident("inc-001", req, "user@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    // ── updateStatus ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateStatus — admin can move OPEN to IN_PROGRESS")
    void updateStatus_openToInProgress() {
        UpdateIncidentStatusRequest req = new UpdateIncidentStatusRequest();
        req.setStatus(Incident.IncidentStatus.IN_PROGRESS);

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));
        when(incidentRepository.save(any())).thenReturn(testIncident);

        incidentService.updateStatus("inc-001", req, "admin@test.com");

        verify(incidentRepository).save(argThat(i -> i.getStatus() == Incident.IncidentStatus.IN_PROGRESS));
    }

    @Test
    @DisplayName("updateStatus — cannot skip from OPEN to RESOLVED")
    void updateStatus_cannotSkipSteps() {
        UpdateIncidentStatusRequest req = new UpdateIncidentStatusRequest();
        req.setStatus(Incident.IncidentStatus.RESOLVED);
        req.setResolutionNotes("Fixed it");

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));

        assertThatThrownBy(() -> incidentService.updateStatus("inc-001", req, "admin@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("IN_PROGRESS");
    }

    @Test
    @DisplayName("updateStatus — admin can reject with reason")
    void updateStatus_adminCanReject() {
        UpdateIncidentStatusRequest req = new UpdateIncidentStatusRequest();
        req.setStatus(Incident.IncidentStatus.REJECTED);
        req.setRejectionReason("Duplicate ticket");

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));
        when(incidentRepository.save(any())).thenReturn(testIncident);

        incidentService.updateStatus("inc-001", req, "admin@test.com");

        verify(incidentRepository).save(argThat(i -> i.getStatus() == Incident.IncidentStatus.REJECTED));
    }

    @Test
    @DisplayName("updateStatus — reject requires reason")
    void updateStatus_rejectRequiresReason() {
        UpdateIncidentStatusRequest req = new UpdateIncidentStatusRequest();
        req.setStatus(Incident.IncidentStatus.REJECTED);
        req.setRejectionReason("");

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));

        assertThatThrownBy(() -> incidentService.updateStatus("inc-001", req, "admin@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("reason");
    }

    // ── addComment ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("addComment — owner can add comment")
    void addComment_ownerCanComment() {
        CommentRequest req = new CommentRequest();
        req.setContent("Please fix urgently");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(regularUser));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));
        when(incidentRepository.save(any())).thenReturn(testIncident);

        incidentService.addComment("inc-001", req, "user@test.com");

        verify(incidentRepository).save(any(Incident.class));
    }

    // ── deleteComment ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteComment — user cannot delete another user's comment")
    void deleteComment_cannotDeleteOthersComment() {
        Incident.Comment comment = new Incident.Comment();
        comment.setId("comment-001");
        comment.setContent("Some comment");
        comment.setCreatedByEmail("other@test.com");
        comment.setCreatedByUserId("other-001");
        testIncident.getComments().add(comment);

        User stranger = new User();
        stranger.setId("stranger-001");
        stranger.setEmail("stranger@test.com");
        stranger.setRoles(Set.of("ROLE_USER"));

        when(userRepository.findByEmail("stranger@test.com")).thenReturn(Optional.of(stranger));
        when(incidentRepository.findById("inc-001")).thenReturn(Optional.of(testIncident));

        assertThatThrownBy(() -> incidentService.deleteComment("inc-001", "comment-001", "stranger@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Unauthorized");
    }

    // ── getAssignableUsers ─────────────────────────────────────────────────────

    @Test
    @DisplayName("getAssignableUsers — returns technicians and staff only")
    void getAssignableUsers_returnsTechniciansAndStaff() {
        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(adminUser));
        when(userRepository.findAll()).thenReturn(List.of(adminUser, regularUser, techUser));

        List<AssigneeDTO> result = incidentService.getAssignableUsers("admin@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getEmail()).isEqualTo("tech@test.com");
    }
}
