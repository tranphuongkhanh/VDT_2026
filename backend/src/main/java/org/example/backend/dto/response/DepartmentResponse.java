package org.example.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {
    private Long id;
    private String code;
    private String name;
    private Long parentId;
    private Integer level;
    private String path;
    private ManagerInfo manager;
    private Boolean isActive;
    private List<DepartmentResponse> children;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ManagerInfo {
        private Long id;
        private String fullName;
    }
}
