package com.sliit.paf.backend.services;

import com.sliit.paf.backend.models.Incident;
import io.imagekit.sdk.ImageKit;
import io.imagekit.sdk.config.Configuration;
import io.imagekit.sdk.models.FileCreateRequest;
import io.imagekit.sdk.models.results.Result;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ImageKitService {

    @Value("${imagekit.public-key:}")
    private String publicKey;

    @Value("${imagekit.private-key:}")
    private String privateKey;

    @Value("${imagekit.url-endpoint:}")
    private String urlEndpoint;

    @Value("${imagekit.incident-folder:/smart-campus/incidents}")
    private String incidentFolder;

    private boolean configured;

    @PostConstruct
    public void init() {
        configured = !publicKey.isBlank() && !privateKey.isBlank() && !urlEndpoint.isBlank();
        if (configured) {
            ImageKit imageKit = ImageKit.getInstance();
            imageKit.setConfig(new Configuration(publicKey, privateKey, urlEndpoint));
        }
    }

    public List<Incident.Attachment> uploadIncidentAttachments(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return List.of();
        if (!configured) {
            throw new RuntimeException("ImageKit is not configured. Please set imagekit.public-key, imagekit.private-key, imagekit.url-endpoint");
        }

        List<Incident.Attachment> attachments = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String safeName = UUID.randomUUID() + "_" + sanitize(file.getOriginalFilename());
                FileCreateRequest request = new FileCreateRequest(file.getBytes(), safeName);
                request.setFolder(incidentFolder);
                request.setUseUniqueFileName(true);
                Result result = ImageKit.getInstance().upload(request);

                attachments.add(new Incident.Attachment(
                        result.getFileId(),
                        file.getOriginalFilename(),
                        result.getUrl()
                ));
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload incident attachment: " + e.getMessage());
            }
        }

        return attachments;
    }

    private String sanitize(String originalName) {
        if (originalName == null || originalName.isBlank()) return "attachment";
        return originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}

