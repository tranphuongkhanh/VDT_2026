package org.example.backend;

import org.example.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class TestDatabaseCleanup {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private RequestLogRepository requestLogRepository;

    @Autowired
    private RequestApprovalRepository requestApprovalRepository;

    @Autowired
    private RequestRepository requestRepository;

    @Autowired
    private WorkflowStepRepository workflowStepRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private FormRepository formRepository;

    @Autowired
    private RequestTypeRepository requestTypeRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Transactional
    public void clearDatabase() {
        // 1. Delete notifications, attachments, logs, approvals
        notificationRepository.deleteAllInBatch();
        attachmentRepository.deleteAllInBatch();
        requestLogRepository.deleteAllInBatch();
        requestApprovalRepository.deleteAllInBatch();

        // 2. Delete requests
        requestRepository.deleteAllInBatch();

        // 3. Delete workflow steps, workflows, forms
        workflowStepRepository.deleteAllInBatch();
        workflowRepository.deleteAllInBatch();
        formRepository.deleteAllInBatch();

        // 4. Delete request types and categories
        requestTypeRepository.deleteAllInBatch();
        categoryRepository.deleteAllInBatch();

        // 5. Delete authentication tokens
        refreshTokenRepository.deleteAllInBatch();
        passwordResetTokenRepository.deleteAllInBatch();

        // 6. Delete user roles
        userRoleRepository.deleteAllInBatch();

        // 7. Break circular dependencies for users and departments
        userRepository.findAll().forEach(user -> {
            user.setDepartment(null);
            user.setManager(null);
            userRepository.save(user);
        });
        departmentRepository.findAll().forEach(dept -> {
            dept.setManager(null);
            dept.setParent(null);
            departmentRepository.save(dept);
        });
        
        userRepository.flush();
        departmentRepository.flush();

        // 8. Delete users, departments, roles
        userRepository.deleteAllInBatch();
        departmentRepository.deleteAllInBatch();
        roleRepository.deleteAllInBatch();
    }
}
