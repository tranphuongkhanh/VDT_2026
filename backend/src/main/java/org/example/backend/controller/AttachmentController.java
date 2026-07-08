package org.example.backend.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.example.backend.dto.response.AttachmentResponse;
import org.example.backend.service.AttachmentService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Attachment", description = "Attachment management APIs")
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping(value = "/requests/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload attachment", description = "Upload a file for a specific request")
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        AttachmentResponse response = attachmentService.uploadAttachment(id, file);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/requests/{id}/attachments")
    @Operation(summary = "Get attachments by request", description = "Get list of attachments for a request")
    public ResponseEntity<List<AttachmentResponse>> getAttachments(@PathVariable Long id) {
        List<AttachmentResponse> responses = attachmentService.getAttachmentsByRequestId(id);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/attachments/{id}/download")
    @Operation(summary = "Download attachment", description = "Get signed URL for attachment download")
    public ResponseEntity<Void> downloadAttachment(@PathVariable Long id) {
        String url = attachmentService.getAttachmentUrl(id);
        return ResponseEntity.status(org.springframework.http.HttpStatus.FOUND)
                .location(java.net.URI.create(url))
                .build();
    }

    @DeleteMapping("/attachments/{id}")
    @Operation(summary = "Delete attachment", description = "Soft delete an attachment")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        attachmentService.deleteAttachment(id);
        return ResponseEntity.ok().build();
    }
}
