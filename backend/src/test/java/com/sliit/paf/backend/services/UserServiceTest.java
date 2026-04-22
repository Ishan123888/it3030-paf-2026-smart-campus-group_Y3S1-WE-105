package com.sliit.paf.backend.services;

import com.sliit.paf.backend.dto.UserDTO;
import com.sliit.paf.backend.models.User;
import com.sliit.paf.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for UserService — Member 4 (Auth & Role Management)
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock private UserRepository userRepository;

    @InjectMocks private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId("user-001");
        testUser.setEmail("user@test.com");
        testUser.setName("Test User");
        testUser.setRoles(Set.of("ROLE_USER"));
        testUser.setActive(true);
        testUser.setProvider("local");
    }

    // ── getUserByEmail ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserByEmail — returns DTO when user exists")
    void getUserByEmail_returnsDTO() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserByEmail("user@test.com");

        assertThat(result.getEmail()).isEqualTo("user@test.com");
        assertThat(result.getName()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("getUserByEmail — throws when user not found")
    void getUserByEmail_throwsWhenNotFound() {
        when(userRepository.findByEmail("missing@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserByEmail("missing@test.com"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");
    }

    // ── getUserById ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getUserById — returns DTO when user exists")
    void getUserById_returnsDTO() {
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));

        UserDTO result = userService.getUserById("user-001");

        assertThat(result.getId()).isEqualTo("user-001");
    }

    @Test
    @DisplayName("getUserById — throws when user not found")
    void getUserById_throwsWhenNotFound() {
        when(userRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserById("bad-id"))
                .isInstanceOf(RuntimeException.class);
    }

    // ── getAllUsers ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("getAllUsers — returns all users as DTOs")
    void getAllUsers_returnsAll() {
        User user2 = new User();
        user2.setId("user-002");
        user2.setEmail("admin@test.com");
        user2.setName("Admin");
        user2.setRoles(Set.of("ROLE_ADMIN"));
        user2.setActive(true);

        when(userRepository.findAll()).thenReturn(List.of(testUser, user2));

        List<UserDTO> result = userService.getAllUsers();

        assertThat(result).hasSize(2);
    }

    // ── updateUserRoles ────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateUserRoles — updates to valid roles")
    void updateUserRoles_updatesValidRoles() {
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);

        userService.updateUserRoles("user-001", Set.of("ROLE_ADMIN", "ROLE_USER"));

        verify(userRepository).save(argThat(u ->
                u.getRoles().contains("ROLE_ADMIN") && u.getRoles().contains("ROLE_USER")
        ));
    }

    @Test
    @DisplayName("updateUserRoles — filters out invalid roles, defaults to ROLE_USER")
    void updateUserRoles_filtersInvalidRoles() {
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);

        userService.updateUserRoles("user-001", Set.of("ROLE_HACKER", "ROLE_INVALID"));

        verify(userRepository).save(argThat(u ->
                u.getRoles().contains("ROLE_USER") && u.getRoles().size() == 1
        ));
    }

    @Test
    @DisplayName("updateUserRoles — throws when user not found")
    void updateUserRoles_throwsWhenNotFound() {
        when(userRepository.findById("bad-id")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.updateUserRoles("bad-id", Set.of("ROLE_USER")))
                .isInstanceOf(RuntimeException.class);
    }

    // ── deleteUser ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteUser — deletes when user exists")
    void deleteUser_deletesWhenFound() {
        when(userRepository.existsById("user-001")).thenReturn(true);

        userService.deleteUser("user-001");

        verify(userRepository).deleteById("user-001");
    }

    @Test
    @DisplayName("deleteUser — throws when user not found")
    void deleteUser_throwsWhenNotFound() {
        when(userRepository.existsById("bad-id")).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser("bad-id"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not found");

        verify(userRepository, never()).deleteById(any());
    }

    // ── updateProfile ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile — updates name and bio")
    void updateProfile_updatesFields() {
        UserDTO dto = new UserDTO();
        dto.setName("Updated Name");
        dto.setBio("New bio");
        dto.setJobTitle("Developer");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);

        userService.updateProfile("user@test.com", dto);

        verify(userRepository).save(argThat(u ->
                u.getName().equals("Updated Name") &&
                u.getBio().equals("New bio") &&
                u.getJobTitle().equals("Developer")
        ));
    }

    @Test
    @DisplayName("updateProfile — does not overwrite name when blank")
    void updateProfile_doesNotOverwriteNameWhenBlank() {
        UserDTO dto = new UserDTO();
        dto.setName("");
        dto.setBio("Some bio");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);

        userService.updateProfile("user@test.com", dto);

        verify(userRepository).save(argThat(u -> u.getName().equals("Test User")));
    }

    // ── toggleUserActive ───────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleUserActive — toggles active to inactive")
    void toggleUserActive_toggesToInactive() {
        testUser.setActive(true);
        when(userRepository.findById("user-001")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any())).thenReturn(testUser);

        userService.toggleUserActive("user-001");

        verify(userRepository).save(argThat(u -> !u.isActive()));
    }
}
