package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.config.SecurityConfig;
import com.sliit.paf.backend.dto.UserDTO;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.UserRepository;
import com.sliit.paf.backend.services.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityConfig securityConfig;

    public UserController(UserService userService,
                          UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          SecurityConfig securityConfig) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityConfig = securityConfig;
    }

    // -----------------------------------------------------------------------
    // POST /api/auth/register
    // Public endpoint for self-registration (Student/Staff)
    // -----------------------------------------------------------------------
    @PostMapping("/auth/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest req) {

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered. Please login."));
        }

        // Role Mapping Logic
        String assignedRole = "ROLE_USER"; // Default as Student
        if ("STAFF".equalsIgnoreCase(req.getRole())) {
            assignedRole = "ROLE_STAFF";
        }

        User newUser = new User();
        newUser.setName(req.getName());
        newUser.setEmail(req.getEmail());
        newUser.setPassword(passwordEncoder.encode(req.getPassword()));
        newUser.setRoles(new HashSet<>(Set.of(assignedRole)));
        newUser.setProvider("local"); // Distinguish from Google users
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setLastLogin(LocalDateTime.now());

        userRepository.save(newUser);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Registration successful. Please login."));
    }

    // -----------------------------------------------------------------------
    // POST /api/auth/login
    // local login flow using JWT
    // -----------------------------------------------------------------------
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {

        User user = userRepository.findByEmail(req.getEmail()).orElse(null);

        // Secure password check
        if (user == null || user.getPassword() == null ||
                !passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password."));
        }

        Set<String> roles = user.getRoles();
        if (roles == null || roles.isEmpty()) {
            roles = new HashSet<>(Set.of("ROLE_USER"));
        }

        // Generate JWT token
        String token = securityConfig.generateTokenForLocalUser(
                user.getEmail(), roles, user.getName()
        );

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "token", token,
                "roles", roles,
                "name", user.getName(),
                "email", user.getEmail()
        ));
    }

    // -----------------------------------------------------------------------
    // GET /api/users/me (Authenticated User Only)
    // -----------------------------------------------------------------------
    @GetMapping("/users/me")
    public ResponseEntity<UserDTO> getMyProfile(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UserDTO user = userService.getUserByEmail(principal.getName());
        return ResponseEntity.ok(user);
    }

    // -----------------------------------------------------------------------
    // Admin Only Endpoints (Member 4 - Role Based Access Control)
    // -----------------------------------------------------------------------

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> getUserById(@PathVariable String id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @PutMapping("/users/{id}/roles")
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

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable String id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    // ── Request DTOs ──────────────────────────────────────────────────────

    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Valid email required")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 6, message = "Password must be at least 6 characters")
        private String password;

        private String role = "STUDENT";

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class LoginRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}