package org.example.backend.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReorderStepsRequest {
    @NotEmpty(message = "Step IDs cannot be empty")
    private List<Long> stepIds;
}
