package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.ResourceDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    // ── Admin: Create ──────────────────────────────────────────────────────────

    public ResourceDTO createResource(ResourceDTO dto) {
        Resource resource = toEntity(dto);
        resource.setCreatedAt(LocalDateTime.now());
        resource.setUpdatedAt(LocalDateTime.now());
        if (resource.getStatus() == null) resource.setStatus(Resource.ResourceStatus.ACTIVE);
        return toDTO(resourceRepository.save(resource));
    }

    // ── Admin: Update ──────────────────────────────────────────────────────────

    public ResourceDTO updateResource(String id, ResourceDTO dto) {
        Resource existing = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));

        existing.setName(dto.getName());
        existing.setType(dto.getType());
        existing.setBrand(dto.getBrand());
        existing.setLocation(dto.getLocation());
        existing.setCapacity(dto.getCapacity());
        existing.setDescription(dto.getDescription());
        existing.setPricePerHour(dto.getPricePerHour());
        existing.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "LKR");
        existing.setAvailabilityWindows(dto.getAvailabilityWindows());
        if (dto.getStatus() != null) existing.setStatus(dto.getStatus());
        existing.setImages(dto.getImages());
        existing.setUpdatedAt(LocalDateTime.now());

        return toDTO(resourceRepository.save(existing));
    }

    // ── Admin: Toggle Status ───────────────────────────────────────────────────

    public ResourceDTO toggleStatus(String id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id));

        resource.setStatus(resource.getStatus() == Resource.ResourceStatus.ACTIVE
                ? Resource.ResourceStatus.OUT_OF_SERVICE
                : Resource.ResourceStatus.ACTIVE);
        resource.setUpdatedAt(LocalDateTime.now());

        return toDTO(resourceRepository.save(resource));
    }

    // ── Admin: Delete ──────────────────────────────────────────────────────────

    public void deleteResource(String id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found: " + id);
        }
        resourceRepository.deleteById(id);
    }

    // ── Shared: Get All (with optional filters) ────────────────────────────────

    public List<ResourceDTO> getResources(String type, String brand, String location,
                                          Integer minCapacity, String status, String search) {
        List<Resource> all = resourceRepository.findAll();

        return all.stream()
                .filter(r -> type == null || r.getType().name().equalsIgnoreCase(type))
                .filter(r -> brand == null || r.getBrand().equalsIgnoreCase(brand))
                .filter(r -> location == null || r.getLocation().toLowerCase().contains(location.toLowerCase()))
                .filter(r -> minCapacity == null || r.getCapacity() >= minCapacity)
                .filter(r -> status == null || r.getStatus().name().equalsIgnoreCase(status))
                .filter(r -> search == null || r.getName().toLowerCase().contains(search.toLowerCase()))
                .sorted(Comparator.comparing(Resource::getCreatedAt, Comparator.nullsFirst(Comparator.reverseOrder())))
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    // ── Shared: Get One ────────────────────────────────────────────────────────

    public ResourceDTO getResourceById(String id) {
        return toDTO(resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + id)));
    }

    // ── Mapping ────────────────────────────────────────────────────────────────

    private Resource toEntity(ResourceDTO dto) {
        Resource r = new Resource();
        r.setName(dto.getName());
        r.setType(dto.getType());
        r.setBrand(dto.getBrand());
        r.setLocation(dto.getLocation());
        r.setCapacity(dto.getCapacity());
        r.setDescription(dto.getDescription());
        r.setStatus(dto.getStatus() != null ? dto.getStatus() : Resource.ResourceStatus.ACTIVE);
        r.setAvailabilityWindows(dto.getAvailabilityWindows());
        r.setPricePerHour(dto.getPricePerHour());
        r.setCurrency(dto.getCurrency() != null ? dto.getCurrency() : "LKR");
        r.setImages(dto.getImages());
        return r;
    }

    public ResourceDTO toDTO(Resource r) {
        ResourceDTO dto = new ResourceDTO();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setType(r.getType());
        dto.setBrand(r.getBrand());
        dto.setLocation(r.getLocation());
        dto.setCapacity(r.getCapacity());
        dto.setDescription(r.getDescription());
        dto.setStatus(r.getStatus());
        dto.setAvailabilityWindows(r.getAvailabilityWindows());
        dto.setPricePerHour(r.getPricePerHour());
        dto.setCurrency(r.getCurrency() != null ? r.getCurrency() : "LKR");
        dto.setImages(r.getImages());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setUpdatedAt(r.getUpdatedAt());
        return dto;
    }
}
