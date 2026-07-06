package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoleRequest {
    @NotBlank(message = "Role name is required")
    private String name;

    private String description;
}
