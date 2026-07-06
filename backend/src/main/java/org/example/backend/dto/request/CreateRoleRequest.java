package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoleRequest {
    @NotBlank(message = "Role code is required")
    @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Code must be uppercase alphanumeric and can include dash or underscore")
    private String code;

    @NotBlank(message = "Role name is required")
    private String name;

    private String description;
}
