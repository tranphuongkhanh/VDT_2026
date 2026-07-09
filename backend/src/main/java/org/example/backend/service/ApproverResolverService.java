package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.entity.Department;
import org.example.backend.entity.User;
import org.example.backend.entity.WorkflowStep;
import org.example.backend.repository.DepartmentRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.UserRoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Service xác định người có quyền duyệt một bước workflow.
 */
@Service
@RequiredArgsConstructor
public class ApproverResolverService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final DepartmentRepository departmentRepository;

    /**
     * Kiểm tra currentUser có quyền duyệt bước step với requester là người tạo yêu
     * cầu không.
     */
    @Transactional(readOnly = true)
    public boolean isAuthorizedApprover(User currentUser, WorkflowStep step, User requester) {
        return switch (step.getApproverType()) {
            case USER ->
                // Chỉ đúng một user cụ thể
                step.getApproverRefId() != null &&
                        step.getApproverRefId().equals(currentUser.getId());

            case ROLE ->
                // Người dùng có role tương ứng
                userRoleRepository.findByUserId(currentUser.getId()).stream()
                        .anyMatch(ur -> ur.getRole().getId().equals(step.getApproverRefId())
                                && (ur.getExpiresAt() == null
                                        || ur.getExpiresAt().isAfter(java.time.LocalDateTime.now())));

            case DEPARTMENT_HEAD -> {
                // currentUser là trưởng phòng của phòng ban mà requester thuộc về
                Department requesterDept = requester.getDepartment();
                yield requesterDept != null
                        && requesterDept.getManager() != null
                        && requesterDept.getManager().getId().equals(currentUser.getId());
            }

            case DIRECT_MANAGER ->
                // currentUser là quản lý trực tiếp của requester
                requester.getManager() != null &&
                        requester.getManager().getId().equals(currentUser.getId());

            case SPECIFIC_DEPARTMENT_HEAD -> {
                // currentUser là trưởng phòng của phòng ban được chỉ định trong workflow
                if (step.getApproverRefId() == null)
                    yield false;
                Department dept = departmentRepository.findById(step.getApproverRefId()).orElse(null);
                yield dept != null
                        && dept.getManager() != null
                        && dept.getManager().getId().equals(currentUser.getId());
            }
        };
    }

    /**
     * Tìm danh sách tất cả user có thể duyệt bước này.
     * Dùng để gửi thông báo PENDING_APPROVAL khi request đến bước mới.
     */
    @Transactional(readOnly = true)
    public List<User> findApproversForStep(WorkflowStep step, User requester) {
        List<User> approvers = new ArrayList<>();

        switch (step.getApproverType()) {
            case USER -> {
                if (step.getApproverRefId() != null) {
                    userRepository.findById(step.getApproverRefId()).ifPresent(approvers::add);
                }
            }
            case ROLE -> {
                if (step.getApproverRefId() != null) {
                    userRoleRepository.findByRoleId(step.getApproverRefId()).stream()
                            .filter(ur -> ur.getExpiresAt() == null
                                    || ur.getExpiresAt().isAfter(java.time.LocalDateTime.now()))
                            .map(ur -> ur.getUser())
                            .filter(u -> Boolean.TRUE.equals(u.getIsActive()))
                            .forEach(approvers::add);
                }
            }
            case DEPARTMENT_HEAD -> {
                Department dept = requester.getDepartment();
                if (dept != null && dept.getManager() != null) {
                    approvers.add(dept.getManager());
                }
            }
            case DIRECT_MANAGER -> {
                if (requester.getManager() != null) {
                    approvers.add(requester.getManager());
                }
            }
            case SPECIFIC_DEPARTMENT_HEAD -> {
                if (step.getApproverRefId() != null) {
                    departmentRepository.findById(step.getApproverRefId())
                            .filter(d -> d.getManager() != null)
                            .ifPresent(d -> approvers.add(d.getManager()));
                }
            }
        }

        return approvers;
    }

    /**
     * Đếm tổng số approver hợp lệ của một bước (dùng cho RoleApprovalMode=ALL).
     */
    @Transactional(readOnly = true)
    public int countTotalApprovers(WorkflowStep step, User requester) {
        return findApproversForStep(step, requester).size();
    }
}
