package org.example.backend.service;

import org.example.backend.dto.response.AttachmentResponse;
import org.example.backend.entity.Attachment;
import org.example.backend.entity.Request;
import org.example.backend.entity.User;
import org.example.backend.enums.RequestStatus;
import org.example.backend.repository.AttachmentRepository;
import org.example.backend.repository.RequestRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public AttachmentService(AttachmentRepository attachmentRepository, RequestRepository requestRepository,
            UserRepository userRepository, FileStorageService fileStorageService) {
        this.attachmentRepository = attachmentRepository;
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            return userRepository.findById(userDetails.getId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        }
        throw new RuntimeException("User not authenticated");
    }

    @Transactional
    public AttachmentResponse uploadAttachment(Long requestId, MultipartFile file) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        User currentUser = getCurrentUser();

        String storageKey = fileStorageService.storeFile(file);

        Attachment attachment = Attachment.builder()
                .request(request)
                .uploadedBy(currentUser)
                .fileName(file.getOriginalFilename())
                .storageKey(storageKey)
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .isDeleted(false)
                .build();

        Attachment savedAttachment = attachmentRepository.save(attachment);

        return mapToResponse(savedAttachment);
    }

    @Transactional(readOnly = true)
    public List<AttachmentResponse> getAttachmentsByRequestId(Long requestId) {
        if (!requestRepository.existsById(requestId)) {
            throw new RuntimeException("Request not found");
        }
        return attachmentRepository.findByRequestIdAndIsDeletedFalse(requestId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public String getAttachmentUrl(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
        if (attachment.getIsDeleted()) {
            throw new RuntimeException("Attachment has been deleted");
        }
        return fileStorageService.getFileUrl(attachment.getStorageKey());
    }

    @Transactional
    public void deleteAttachment(Long attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));

        if (attachment.getIsDeleted()) {
            throw new RuntimeException("Attachment is already deleted");
        }

        Request request = attachment.getRequest();
        if (request.getStatus() == RequestStatus.APPROVED || request.getStatus() == RequestStatus.REJECTED
                || request.getStatus() == RequestStatus.CLOSED) {
            throw new RuntimeException("Cannot delete attachment when request is APPROVED, REJECTED, or CLOSED");
        }

        attachment.setIsDeleted(true);
        attachmentRepository.save(attachment);
    }

    public Attachment getAttachmentEntity(Long attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new RuntimeException("Attachment not found"));
    }

    private AttachmentResponse mapToResponse(Attachment attachment) {
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .requestId(attachment.getRequest().getId())
                .uploadedBy(attachment.getUploadedBy().getId())
                .uploaderName(attachment.getUploadedBy().getFullName())
                .fileName(attachment.getFileName())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
