package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRequestTypeRequest {

    @NotBlank(message = "Request type code is required")
    @Size(max = 50, message = "Code cannot exceed 50 characters")
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "Code must be uppercase alphanumeric and can include underscores")
    private String code;

    @NotBlank(message = "Request type name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    private String description;

    @Size(max = 100, message = "Icon cannot exceed 100 characters")
    private String icon;

    private Long categoryId;

    private Integer sortOrder;
}
