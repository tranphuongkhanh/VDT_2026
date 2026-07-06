package org.example.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private Boolean isSystem;
    private LocalDateTime createdAt;
}
