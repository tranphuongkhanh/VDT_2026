package org.example.backend.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormResponse {
    private Long id;
    private Long requestTypeId;
    private String name;
    private Integer version;
    private JsonNode schemaData;
    private Boolean isActive;
    private String createdByUsername;
    private LocalDateTime createdAt;
}
