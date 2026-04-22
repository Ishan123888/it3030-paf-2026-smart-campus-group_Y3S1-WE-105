package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.ResourceDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.repository.ResourceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ResourceService — Member 1
 * Tests cover: createResource, getResourceById, updateResource,
 *              toggleStatus, deleteResource, getResources (filtering)
 */
@ExtendWith(MockitoExtension.class)
class ResourceServiceTest {

    @Mock
    private ResourceRepository resourceRepository;

    @InjectMocks
    private ResourceService resourceService;

    private Resource sampleResource;
    private ResourceDTO sampleDTO;

    @BeforeEach
    void setUp() {
        sampleResource = new Resource();
        sampleResource.setId("res-001");
        sampleResource.setName("Lab 04");
        sampleResource.setType(Resource.ResourceType.LAB);
        sampleResource.setBrand("Brand 1");
        sampleResource.setLocation("F504");
        sampleResource.setCapacity(30);
        sampleResource.setDescription("Computer lab");
        sampleResource.setStatus(Resource.ResourceStatus.ACTIVE);
        sampleResource.setPricePerHour(700);
        sampleResource.setCurrency("LKR");
        sampleResource.setCreatedAt(LocalDateTime.now());
        sampleResource.setUpdatedAt(LocalDateTime.now());

        sampleDTO = new ResourceDTO();
        sampleDTO.setName("Lab 04");
        sampleDTO.setType(Resource.ResourceType.LAB);
        sampleDTO.setBrand("Brand 1");
        sampleDTO.setLocation("F504");
        sampleDTO.setCapacity(30);
        sampleDTO.setDescription("Computer lab");
        sampleDTO.setStatus(Resource.ResourceStatus.ACTIVE);
        sampleDTO.setPricePerHour(700);
        sampleDTO.setCurrency("LKR");
    }

    // ── createResource ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("createResource — should save and return DTO with ACTIVE status")
    void createResource_shouldReturnSavedDTO() {
        when(resourceRepository.save(any(Resource.class))).thenReturn(sampleResource);

        ResourceDTO result = resourceService.createResource(sampleDTO);

        assertThat(result).isNotNull();
        assertThat(result.getName()).isEqualTo("Lab 04");
        assertThat(result.getStatus()).isEqualTo(Resource.ResourceStatus.ACTIVE);
        verify(resourceRepository, times(1)).save(any(Resource.class));
    }

    @Test
    @DisplayName("createResource — should default status to ACTIVE when not provided")
    void createResource_shouldDefaultToActive() {
        sampleDTO.setStatus(null);
        when(resourceRepository.save(any(Resource.class))).thenReturn(sampleResource);

        ResourceDTO result = resourceService.createResource(sampleDTO);

        assertThat(result.getStatus()).isEqualTo(Resource.ResourceStatus.ACTIVE);
    }

    // ── getResourceById ────────────────────────────────────────────────────────

    @Test
    @DisplayName("getResourceById — should return DTO when resource exists")
    void getResourceById_shouldReturnDTO_whenFound() {
        when(resourceRepository.findById("res-001")).thenReturn(Optional.of(sampleResource));

        ResourceDTO result = resourceService.getResourceById("res-001");

        assertThat(result.getId()).isEqualTo("res-001");
        assertThat(result.getName()).isEqualTo("Lab 04");
        assertThat(result.getLocation()).isEqualTo("F504");
    }

    @Test
    @DisplayName("getResourceById — should throw ResourceNotFoundException when not found")
    void getResourceById_shouldThrow_whenNotFound() {
        when(resourceRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceService.getResourceById("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("bad-id");
    }

    // ── updateResource ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateResource — should update fields and return updated DTO")
    void updateResource_shouldUpdateAndReturn() {
        sampleDTO.setName("Lab 04 Updated");
        sampleDTO.setCapacity(40);

        Resource updated = new Resource();
        updated.setId("res-001");
        updated.setName("Lab 04 Updated");
        updated.setType(Resource.ResourceType.LAB);
        updated.setBrand("Brand 1");
        updated.setLocation("F504");
        updated.setCapacity(40);
        updated.setStatus(Resource.ResourceStatus.ACTIVE);
        updated.setCurrency("LKR");

        when(resourceRepository.findById("res-001")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenReturn(updated);

        ResourceDTO result = resourceService.updateResource("res-001", sampleDTO);

        assertThat(result.getName()).isEqualTo("Lab 04 Updated");
        assertThat(result.getCapacity()).isEqualTo(40);
    }

    @Test
    @DisplayName("updateResource — should throw ResourceNotFoundException when resource missing")
    void updateResource_shouldThrow_whenNotFound() {
        when(resourceRepository.findById("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resourceService.updateResource("missing", sampleDTO))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ── toggleStatus ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleStatus — should switch ACTIVE to OUT_OF_SERVICE")
    void toggleStatus_shouldSwitchActiveToOutOfService() {
        sampleResource.setStatus(Resource.ResourceStatus.ACTIVE);

        Resource toggled = new Resource();
        toggled.setId("res-001");
        toggled.setName("Lab 04");
        toggled.setType(Resource.ResourceType.LAB);
        toggled.setBrand("Brand 1");
        toggled.setLocation("F504");
        toggled.setCapacity(30);
        toggled.setStatus(Resource.ResourceStatus.OUT_OF_SERVICE);
        toggled.setCurrency("LKR");

        when(resourceRepository.findById("res-001")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenReturn(toggled);

        ResourceDTO result = resourceService.toggleStatus("res-001");

        assertThat(result.getStatus()).isEqualTo(Resource.ResourceStatus.OUT_OF_SERVICE);
    }

    @Test
    @DisplayName("toggleStatus — should switch OUT_OF_SERVICE back to ACTIVE")
    void toggleStatus_shouldSwitchOutOfServiceToActive() {
        sampleResource.setStatus(Resource.ResourceStatus.OUT_OF_SERVICE);

        Resource toggled = new Resource();
        toggled.setId("res-001");
        toggled.setName("Lab 04");
        toggled.setType(Resource.ResourceType.LAB);
        toggled.setBrand("Brand 1");
        toggled.setLocation("F504");
        toggled.setCapacity(30);
        toggled.setStatus(Resource.ResourceStatus.ACTIVE);
        toggled.setCurrency("LKR");

        when(resourceRepository.findById("res-001")).thenReturn(Optional.of(sampleResource));
        when(resourceRepository.save(any(Resource.class))).thenReturn(toggled);

        ResourceDTO result = resourceService.toggleStatus("res-001");

        assertThat(result.getStatus()).isEqualTo(Resource.ResourceStatus.ACTIVE);
    }

    // ── deleteResource ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteResource — should call deleteById when resource exists")
    void deleteResource_shouldDelete_whenFound() {
        when(resourceRepository.existsById("res-001")).thenReturn(true);

        resourceService.deleteResource("res-001");

        verify(resourceRepository, times(1)).deleteById("res-001");
    }

    @Test
    @DisplayName("deleteResource — should throw ResourceNotFoundException when not found")
    void deleteResource_shouldThrow_whenNotFound() {
        when(resourceRepository.existsById("bad-id")).thenReturn(false);

        assertThatThrownBy(() -> resourceService.deleteResource("bad-id"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(resourceRepository, never()).deleteById(any());
    }

    // ── getResources (filtering) ───────────────────────────────────────────────

    @Test
    @DisplayName("getResources — should return all resources when no filters applied")
    void getResources_noFilters_shouldReturnAll() {
        Resource r2 = new Resource();
        r2.setId("res-002");
        r2.setName("Hall 06");
        r2.setType(Resource.ResourceType.LECTURE_HALL);
        r2.setBrand("Brand 2");
        r2.setLocation("Block A");
        r2.setCapacity(100);
        r2.setStatus(Resource.ResourceStatus.ACTIVE);
        r2.setCurrency("LKR");

        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource, r2));

        List<ResourceDTO> results = resourceService.getResources(null, null, null, null, null, null);

        assertThat(results).hasSize(2);
    }

    @Test
    @DisplayName("getResources — should filter by type correctly")
    void getResources_filterByType_shouldReturnMatching() {
        Resource hall = new Resource();
        hall.setId("res-002");
        hall.setName("Hall 06");
        hall.setType(Resource.ResourceType.LECTURE_HALL);
        hall.setBrand("Brand 1");
        hall.setLocation("Block A");
        hall.setCapacity(100);
        hall.setStatus(Resource.ResourceStatus.ACTIVE);
        hall.setCurrency("LKR");

        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource, hall));

        List<ResourceDTO> results = resourceService.getResources("LAB", null, null, null, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Lab 04");
    }

    @Test
    @DisplayName("getResources — should filter by status correctly")
    void getResources_filterByStatus_shouldReturnOnlyActive() {
        Resource oos = new Resource();
        oos.setId("res-003");
        oos.setName("Old Projector");
        oos.setType(Resource.ResourceType.PROJECTOR);
        oos.setBrand("Brand 2");
        oos.setLocation("Room 1");
        oos.setCapacity(1);
        oos.setStatus(Resource.ResourceStatus.OUT_OF_SERVICE);
        oos.setCurrency("LKR");

        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource, oos));

        List<ResourceDTO> results = resourceService.getResources(null, null, null, null, "ACTIVE", null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getStatus()).isEqualTo(Resource.ResourceStatus.ACTIVE);
    }

    @Test
    @DisplayName("getResources — should filter by minimum capacity")
    void getResources_filterByMinCapacity_shouldReturnMatching() {
        Resource smallRoom = new Resource();
        smallRoom.setId("res-004");
        smallRoom.setName("Small Room");
        smallRoom.setType(Resource.ResourceType.MEETING_ROOM);
        smallRoom.setBrand("Brand 1");
        smallRoom.setLocation("Block B");
        smallRoom.setCapacity(5);
        smallRoom.setStatus(Resource.ResourceStatus.ACTIVE);
        smallRoom.setCurrency("LKR");

        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource, smallRoom));

        // sampleResource has capacity 30, smallRoom has 5 — filter for min 20
        List<ResourceDTO> results = resourceService.getResources(null, null, null, 20, null, null);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).isEqualTo("Lab 04");
    }

    @Test
    @DisplayName("getResources — should filter by search term in name")
    void getResources_filterBySearch_shouldReturnMatching() {
        when(resourceRepository.findAll()).thenReturn(List.of(sampleResource));

        List<ResourceDTO> results = resourceService.getResources(null, null, null, null, null, "lab");

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getName()).containsIgnoringCase("lab");
    }

    @Test
    @DisplayName("getResources — should return newest first (sorted by createdAt desc)")
    void getResources_shouldReturnNewestFirst() {
        Resource older = new Resource();
        older.setId("res-old");
        older.setName("Old Lab");
        older.setType(Resource.ResourceType.LAB);
        older.setBrand("Brand 1");
        older.setLocation("Block C");
        older.setCapacity(10);
        older.setStatus(Resource.ResourceStatus.ACTIVE);
        older.setCurrency("LKR");
        older.setCreatedAt(LocalDateTime.now().minusDays(5));

        sampleResource.setCreatedAt(LocalDateTime.now());

        when(resourceRepository.findAll()).thenReturn(List.of(older, sampleResource));

        List<ResourceDTO> results = resourceService.getResources(null, null, null, null, null, null);

        assertThat(results.get(0).getName()).isEqualTo("Lab 04"); // newest first
    }
}
