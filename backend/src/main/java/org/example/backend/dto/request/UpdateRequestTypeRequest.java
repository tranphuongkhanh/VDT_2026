package org.example.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRequestTypeRequest {

    @NotBlank(message = "Request type name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    private String description;

    @Size(max = 100, message = "Icon cannot exceed 100 characters")
    private String icon;

    private Long categoryId;

    private Integer sortOrder;
}
