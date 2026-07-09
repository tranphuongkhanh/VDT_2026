package org.example.backend.dto.request;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;
import org.example.backend.enums.RequestPriority;

import java.time.LocalDate;

@Getter
@Setter
public class UpdateRequestRequest {

    private String title;

    private JsonNode formData;

    private String note;

    private LocalDate dueDate;

    private RequestPriority priority;
}
