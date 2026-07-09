package org.example.backend.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.enums.RequestPriority;

import java.time.LocalDate;

@Getter
@Setter
public class CreateRequestRequest {

    @NotNull(message = "Request type ID is required")
    private Long requestTypeId;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Form data is required")
    private JsonNode formData;

    private String note;

    private LocalDate dueDate;

    private RequestPriority priority = RequestPriority.NORMAL;
}
