package org.example.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleAssignmentRequest {
    @NotNull(message = "Role ID is required")
    private Long roleId;
    private LocalDateTime expiresAt;
}
