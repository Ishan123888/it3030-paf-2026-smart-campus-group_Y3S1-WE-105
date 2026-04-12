package com.sliit.paf.backend.dto.incident;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AssignIncidentRequest {
    @NotBlank(message = "Assignee email is required")
    @Email(message = "Assignee email is invalid")
    private String assigneeEmail;

    public String getAssigneeEmail() { return assigneeEmail; }
    public void setAssigneeEmail(String assigneeEmail) { this.assigneeEmail = assigneeEmail; }
}

