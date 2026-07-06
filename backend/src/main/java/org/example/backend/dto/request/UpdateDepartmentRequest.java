package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateDepartmentRequest {
    @NotBlank(message = "Department name is required")
    private String name;

    private Long parentId;
    private Long managerId;
    private Boolean isActive;
}
