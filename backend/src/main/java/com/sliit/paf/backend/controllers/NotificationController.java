package com.sliit.paf.backend.controllers;

import com.sliit.paf.backend.dto.NotificationDTO;
import com.sliit.paf.backend.services.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(Authentication auth, @RequestBody NotificationDTO dto) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String currentUserEmail = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        if (!isAdmin || dto.getUserId() == null || dto.getUserId().isBlank()) {
            dto.setUserId(currentUserEmail);
        }

        NotificationDTO createdNotification = notificationService.createNotification(dto);
        return new ResponseEntity<>(createdNotification, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(notificationService.getUserNotifications(auth.getName()));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(notificationService.getUnreadNotifications(auth.getName()));
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(auth.getName())));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(@PathVariable String id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String currentUserEmail = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        return ResponseEntity.ok(notificationService.markAsRead(id, currentUserEmail, isAdmin));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        notificationService.markAllAsRead(auth.getName());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteNotification(@PathVariable String id, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String currentUserEmail = auth.getName();
        boolean isAdmin = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_ADMIN"));

        notificationService.deleteNotification(id, currentUserEmail, isAdmin);
        return ResponseEntity.ok(Map.of("message", "Notification deleted successfully"));
    }
}