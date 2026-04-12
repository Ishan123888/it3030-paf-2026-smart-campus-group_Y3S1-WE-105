package com.sliit.paf.backend.dto.incident;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CommentRequest {
    @NotBlank(message = "Comment content is required")
    @Size(max = 1000, message = "Comment must be less than 1000 characters")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}

