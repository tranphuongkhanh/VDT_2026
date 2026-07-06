package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDepartmentRequest {
    @NotBlank(message = "Department code is required")
    @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "Code must be alphanumeric and can include dash or underscore")
    private String code;

    @NotBlank(message = "Department name is required")
    private String name;

    private Long parentId;
    private Long managerId;
}
