package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.dto.ResourceDTO;
import com.sliit.paf.backend.exception.ResourceNotFoundException;
import com.sliit.paf.backend.models.Resource;
import com.sliit.paf.backend.services.ResourceService;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Resource Controller
 *
 * GET    /api/resources              → 200 list all (with optional filters) — PUBLIC
 * GET    /api/resources/types        → 200 list all resource types          — PUBLIC
 * GET    /api/resources/{id}         → 200 get one | 404 not found          — PUBLIC
 * POST   /api/resources              → 201 created | 400 bad request        — ADMIN
 * PUT    /api/resources/{id}         → 200 updated | 400 bad request | 404  — ADMIN
 * PATCH  /api/resources/{id}/status  → 200 toggled | 404 not found          — ADMIN
 * DELETE /api/resources/{id}         → 204 no content | 404 not found       — ADMIN
 */
@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // ── GET /api/resources ─────────────────────────────────────────────────────
    // 200 OK — Cacheable: public data, cache for 60 seconds
    @GetMapping
    public ResponseEntity<List<ResourceDTO>> getResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<ResourceDTO> resources = resourceService.getResources(
                type, brand, location, minCapacity, status, search);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(resources); // 200
    }

    // ── GET /api/resources/types ───────────────────────────────────────────────
    // 200 OK — Cacheable: static enum data, cache for 1 hour
    @GetMapping("/types")
    public ResponseEntity<List<String>> getResourceTypes() {
        List<String> types = Arrays.stream(Resource.ResourceType.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic())
                .body(types); // 200
    }

    // ── GET /api/resources/{id} ────────────────────────────────────────────────
    // 200 OK | 404 Not Found — Cacheable for 60 seconds
    @GetMapping("/{id}")
    public ResponseEntity<?> getResourceById(@PathVariable String id) {
        try {
            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                    .body(resourceService.getResourceById(id)); // 200
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Not Found", "message", ex.getMessage())); // 404
        }
    }

    // ── POST /api/resources ────────────────────────────────────────────────────
    // 201 Created | 400 Bad Request (validation via @Valid + GlobalExceptionHandler)
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceDTO> createResource(@Valid @RequestBody ResourceDTO dto) {
        ResourceDTO created = resourceService.createResource(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created); // 201
    }

    // ── PUT /api/resources/{id} ────────────────────────────────────────────────
    // 200 OK | 400 Bad Request | 404 Not Found
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateResource(
            @PathVariable String id,
            @Valid @RequestBody ResourceDTO dto) {
        try {
            return ResponseEntity.ok(resourceService.updateResource(id, dto)); // 200
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)                // 404
                    .body(Map.of("error", "Not Found", "message", ex.getMessage()));
        }
    }

    // ── PATCH /api/resources/{id}/status ──────────────────────────────────────
    // 200 OK | 404 Not Found
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> toggleStatus(@PathVariable String id) {
        try {
            return ResponseEntity.ok(resourceService.toggleStatus(id)); // 200
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)          // 404
                    .body(Map.of("error", "Not Found", "message", ex.getMessage()));
        }
    }

    // ── DELETE /api/resources/{id} ─────────────────────────────────────────────
    // 204 No Content | 404 Not Found
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteResource(@PathVariable String id) {
        try {
            resourceService.deleteResource(id);
            return ResponseEntity.noContent().build(); // 204
        } catch (ResourceNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND) // 404
                    .body(Map.of("error", "Not Found", "message", ex.getMessage()));
        }
    }
}
