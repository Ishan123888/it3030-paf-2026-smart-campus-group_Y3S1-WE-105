package com.sliit.paf.backend.dto.incident;

import com.sliit.paf.backend.models.User;

import java.util.Set;

public class AssigneeDTO {
    private String id;
    private String name;
    private String email;
    private Set<String> roles;

    public static AssigneeDTO fromModel(User user) {
        AssigneeDTO dto = new AssigneeDTO();
        dto.id = user.getId();
        dto.name = user.getName();
        dto.email = user.getEmail();
        dto.roles = user.getRoles();
        return dto;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public Set<String> getRoles() { return roles; }
}

