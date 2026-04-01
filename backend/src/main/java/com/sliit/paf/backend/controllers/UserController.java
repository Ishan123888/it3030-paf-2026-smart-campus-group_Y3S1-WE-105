package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.dto.UserDTO;
import com.sliit.paf.backend.services.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /api/users/me
     * Returns the currently authenticated user's profile.
     *
     * ✅ FIX: Now protected by .authenticated() in SecurityConfig.
     * Principal will never be null here — Spring Security enforces it.
     * A 401 is returned automatically if no valid JWT is provided.
     */
    @GetMapping("/me")
    public ResponseEntity<UserDTO> getMyProfile(Principal principal) {
        UserDTO user = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(user);
    }

    /**
     * GET /api/users
     * Returns all users — ADMIN only.
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    /**
     * GET /api/users/{id}
     * Returns a single user by ID — ADMIN only.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    /**
     * PUT /api/users/{id}/roles
     * Update a user's roles — ADMIN only.
     * Body: { "roles": ["ROLE_USER", "ROLE_ADMIN"] }
     */
    @PutMapping("/{id}/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateRoles(
            @PathVariable String id,
            @RequestBody Map<String, Set<String>> body) {

        Set<String> roles = body.get("roles");
        if (roles == null || roles.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.updateUserRoles(id, roles));
    }

    /**
     * PATCH /api/users/{id}/toggle-active
     * Enable or disable a user account — ADMIN only.
     */
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> toggleActive(@PathVariable String id) {
        return ResponseEntity.ok(userService.toggleUserActive(id));
    }

    /**
     * DELETE /api/users/{id}
     * Delete a user permanently — ADMIN only.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}