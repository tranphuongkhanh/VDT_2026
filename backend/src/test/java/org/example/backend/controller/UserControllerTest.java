package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.request.*;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
import org.example.backend.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.example.backend.TestDatabaseCleanup;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TestDatabaseCleanup testDatabaseCleanup;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    private User adminUser;
    private User staffUser;
    private Role adminRole;
    private Role staffRole;
    private Department department;

    private String adminToken;
    private String staffToken;

    @BeforeEach
    void setUp() {
        // Clear db using helper
        testDatabaseCleanup.clearDatabase();

        // Create roles
        adminRole = Role.builder().code("ADMIN").name("Administrator").isSystem(true).build();
        adminRole = roleRepository.saveAndFlush(adminRole);

        staffRole = Role.builder().code("STAFF").name("Staff Member").isSystem(true).build();
        staffRole = roleRepository.saveAndFlush(staffRole);

        // Create department
        department = Department.builder().code("IT").name("IT Department").isActive(true).level(0).build();
        department = departmentRepository.saveAndFlush(department);

        // Create users
        adminUser = User.builder()
                .username("admin")
                .email("admin@example.com")
                .passwordHash(passwordEncoder.encode("AdminPass123"))
                .fullName("System Admin")
                .department(department)
                .isActive(true)
                .build();
        adminUser = userRepository.saveAndFlush(adminUser);

        staffUser = User.builder()
                .username("staff")
                .email("staff@example.com")
                .passwordHash(passwordEncoder.encode("StaffPass123"))
                .fullName("Regular Staff")
                .department(department)
                .isActive(true)
                .build();
        staffUser = userRepository.saveAndFlush(staffUser);

        // Assign roles
        UserRole adminUserRole = UserRole.builder()
                .id(new UserRoleId(adminUser.getId(), adminRole.getId()))
                .user(adminUser)
                .role(adminRole)
                .grantedAt(LocalDateTime.now())
                .build();
        userRoleRepository.saveAndFlush(adminUserRole);

        UserRole staffUserRole = UserRole.builder()
                .id(new UserRoleId(staffUser.getId(), staffRole.getId()))
                .user(staffUser)
                .role(staffRole)
                .grantedAt(LocalDateTime.now())
                .build();
        userRoleRepository.saveAndFlush(staffUserRole);

        // Generate JWTs
        adminToken = tokenProvider.generateAccessToken(adminUser.getUsername());
        staffToken = tokenProvider.generateAccessToken(staffUser.getUsername());
    }

    @Test
    void testGetUsers_AdminSuccess() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(2));
    }

    @Test
    void testGetUsers_StaffForbidden() throws Exception {
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void testCreateUser_Success() throws Exception {
        CreateUserRequest request = CreateUserRequest.builder()
                .username("newuser")
                .email("newuser@example.com")
                .password("Password123")
                .fullName("New User")
                .departmentId(department.getId())
                .managerId(adminUser.getId())
                .employeeCode("EMP999")
                .position("Developer")
                .build();

        mockMvc.perform(post("/api/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("newuser"))
                .andExpect(jsonPath("$.email").value("newuser@example.com"))
                .andExpect(jsonPath("$.department.id").value(department.getId()))
                .andExpect(jsonPath("$.manager.id").value(adminUser.getId()));

        assertTrue(userRepository.findByUsername("newuser").isPresent());
    }

    @Test
    void testGetMyProfile_Success() throws Exception {
        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("staff"))
                .andExpect(jsonPath("$.email").value("staff@example.com"));
    }

    @Test
    void testUpdateMyProfile_Success() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .fullName("Staff Name Updated")
                .position("Senior Staff")
                .build();

        mockMvc.perform(put("/api/users/me")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Staff Name Updated"))
                .andExpect(jsonPath("$.position").value("Senior Staff"));
    }

    @Test
    void testCreateDepartment_Success() throws Exception {
        CreateDepartmentRequest request = CreateDepartmentRequest.builder()
                .code("HR_DEPT")
                .name("HR Department")
                .parentId(department.getId())
                .managerId(adminUser.getId())
                .build();

        mockMvc.perform(post("/api/departments")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("HR_DEPT"))
                .andExpect(jsonPath("$.level").value(1))
                .andExpect(jsonPath("$.parentId").value(department.getId()));
    }

    @Test
    void testGetDepartmentTree_Success() throws Exception {
        // Create a child department
        Department child = Department.builder()
                .code("IT_DEV")
                .name("IT Development")
                .parent(department)
                .level(1)
                .isActive(true)
                .build();
        child = departmentRepository.saveAndFlush(child);
        child.setPath(department.getPath() + "/" + child.getId());
        departmentRepository.saveAndFlush(child);

        mockMvc.perform(get("/api/departments")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].code").value("IT"))
                .andExpect(jsonPath("$[0].children[0].code").value("IT_DEV"));
    }

    @Test
    void testCreateRole_Success() throws Exception {
        CreateRoleRequest request = CreateRoleRequest.builder()
                .code("MANAGER")
                .name("Manager Role")
                .description("Department Managers")
                .build();

        mockMvc.perform(post("/api/roles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("MANAGER"))
                .andExpect(jsonPath("$.isSystem").value(false));
    }

    @Test
    void testAssignRole_Success() throws Exception {
        Role assignmentRole = Role.builder().code("HR").name("Human Resources").build();
        assignmentRole = roleRepository.saveAndFlush(assignmentRole);

        RoleAssignmentRequest request = RoleAssignmentRequest.builder()
                .roleId(assignmentRole.getId())
                .build();

        mockMvc.perform(post("/api/users/" + staffUser.getId() + "/roles")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Check assigned
        assertTrue(userRoleRepository.findById(new UserRoleId(staffUser.getId(), assignmentRole.getId())).isPresent());
    }

    @Test
    void testRemoveRole_Success() throws Exception {
        mockMvc.perform(delete("/api/users/" + staffUser.getId() + "/roles/" + staffRole.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        assertFalse(userRoleRepository.findById(new UserRoleId(staffUser.getId(), staffRole.getId())).isPresent());
    }
}
