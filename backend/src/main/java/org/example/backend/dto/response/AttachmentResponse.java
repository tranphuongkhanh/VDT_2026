package org.example.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentResponse {
    private Long id;
    private Long requestId;
    private Long uploadedBy;
    private String uploaderName;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime createdAt;
}
