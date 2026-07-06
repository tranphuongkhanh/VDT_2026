package org.example.backend.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private DepartmentInfo department;
    private ManagerInfo manager;
    private String employeeCode;
    private String position;
    private String avatarUrl;
    private Boolean isActive;
    private List<String> roles;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartmentInfo {
        private Long id;
        private String code;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ManagerInfo {
        private Long id;
        private String fullName;
        private String username;
    }
}
