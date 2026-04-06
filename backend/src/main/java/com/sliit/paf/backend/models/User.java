package com.sliit.paf.backend.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String name;
    private String picture;
    private String googleId;
    
    // Local login (Username/Password) walata avashya fields
    private String password;
    private String provider; // "google" hari "local" hari kiyala save karanna

    // ✅ Supports multiple roles: ROLE_USER, ROLE_ADMIN, ROLE_STAFF
    private Set<String> roles;

    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
    private boolean active = true;

    public User() {
        this.createdAt = LocalDateTime.now();
        this.roles = new HashSet<>();
    }

    // Google OAuth2 login constructor
    public User(String email, String name, String picture, String googleId) {
        this.email = email;
        this.name = name;
        this.picture = picture;
        this.googleId = googleId;
        this.provider = "google";
        this.createdAt = LocalDateTime.now();
        this.lastLogin = LocalDateTime.now();
        this.roles = new HashSet<>(Set.of("ROLE_USER"));
    }

    // ── Getters & Setters ──────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPicture() { return picture; }
    public void setPicture(String picture) { this.picture = picture; }

    public String getGoogleId() { return googleId; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    // Fixed implemented methods
    public void setPassword(String password) {
        this.password = password;
    }

    public String getPassword() {
        return this.password;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProvider() {
        return this.provider;
    }
}