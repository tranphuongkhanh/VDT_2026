package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.example.backend.dto.request.CreateFormRequest;
import org.example.backend.dto.request.CreateRequestTypeRequest;
import org.example.backend.dto.request.UpdateRequestTypeRequest;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import org.example.backend.TestDatabaseCleanup;
import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RequestTypeAndFormControllerTest {

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
        private RequestTypeRepository requestTypeRepository;

        @Autowired
        private FormRepository formRepository;

        @Autowired
        private CategoryRepository categoryRepository;

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
        private String adminToken;
        private String staffToken;

        @BeforeEach
        void setUp() {
                testDatabaseCleanup.clearDatabase();

                adminRole = Role.builder().code("ADMIN").name("Administrator").isSystem(true).build();
                adminRole = roleRepository.saveAndFlush(adminRole);

                staffRole = Role.builder().code("STAFF").name("Staff").isSystem(true).build();
                staffRole = roleRepository.saveAndFlush(staffRole);

                adminUser = User.builder()
                                .username("admin")
                                .email("admin@example.com")
                                .passwordHash(passwordEncoder.encode("AdminPass123"))
                                .fullName("System Admin")
                                .isActive(true)
                                .build();
                adminUser = userRepository.saveAndFlush(adminUser);

                staffUser = User.builder()
                                .username("staff")
                                .email("staff@example.com")
                                .passwordHash(passwordEncoder.encode("StaffPass123"))
                                .fullName("Regular Staff")
                                .isActive(true)
                                .build();
                staffUser = userRepository.saveAndFlush(staffUser);

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

                adminToken = tokenProvider.generateAccessToken(adminUser.getUsername());
                staffToken = tokenProvider.generateAccessToken(staffUser.getUsername());
        }

        @Test
        void testCreateAndGetRequestType_Success() throws Exception {
                Category hrCategory = Category.builder().name("HR").isActive(true).build();
                hrCategory = categoryRepository.saveAndFlush(hrCategory);

                CreateRequestTypeRequest createReq = CreateRequestTypeRequest.builder()
                                .code("LEAVE_REQUEST")
                                .name("Leave Request")
                                .description("Request leave from work")
                                .icon("leave-icon")
                                .categoryId(hrCategory.getId())
                                .sortOrder(1)
                                .build();

                mockMvc.perform(post("/api/request-types")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").isNotEmpty())
                                .andExpect(jsonPath("$.code").value("LEAVE_REQUEST"))
                                .andExpect(jsonPath("$.categoryId").value(hrCategory.getId()))
                                .andExpect(jsonPath("$.categoryName").value("HR"))
                                .andExpect(jsonPath("$.isActive").value(true));

                // Get active request types as normal staff
                mockMvc.perform(get("/api/request-types")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content[0].code").value("LEAVE_REQUEST"));
        }

        @Test
        void testCreateRequestType_ForbiddenForStaff() throws Exception {
                CreateRequestTypeRequest createReq = CreateRequestTypeRequest.builder()
                                .code("LEAVE_REQUEST")
                                .name("Leave Request")
                                .build();

                mockMvc.perform(post("/api/request-types")
                                .header("Authorization", "Bearer " + staffToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createReq)))
                                .andExpect(status().isForbidden());
        }

        @Test
        void testUpdateRequestType_Success() throws Exception {
                RequestType rt = RequestType.builder()
                                .code("PURCHASE")
                                .name("Purchase Request")
                                .isActive(true)
                                .build();
                rt = requestTypeRepository.saveAndFlush(rt);

                UpdateRequestTypeRequest updateReq = UpdateRequestTypeRequest.builder()
                                .name("Updated Purchase Request")
                                .description("New description")
                                .sortOrder(5)
                                .build();

                mockMvc.perform(put("/api/request-types/" + rt.getId())
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(updateReq)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("Updated Purchase Request"))
                                .andExpect(jsonPath("$.description").value("New description"))
                                .andExpect(jsonPath("$.sortOrder").value(5));
        }

        @Test
        void testDeactivateRequestType_Success() throws Exception {
                RequestType rt = RequestType.builder()
                                .code("PURCHASE")
                                .name("Purchase Request")
                                .isActive(true)
                                .build();
                rt = requestTypeRepository.saveAndFlush(rt);

                mockMvc.perform(patch("/api/request-types/" + rt.getId() + "/deactivate")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk());

                // Now retrieve list, should be empty for active request types
                mockMvc.perform(get("/api/request-types")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(0));

                // ADMIN should still see it if requesting all
                mockMvc.perform(get("/api/request-types")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(1))
                                .andExpect(jsonPath("$.content[0].isActive").value(false));
        }

        @Test
        void testFormLifecycle_Success() throws Exception {
                RequestType rt = RequestType.builder()
                                .code("LEAVE")
                                .name("Leave Request")
                                .isActive(true)
                                .build();
                rt = requestTypeRepository.saveAndFlush(rt);

                ObjectNode schema = objectMapper.createObjectNode();
                schema.put("type", "object");

                CreateFormRequest createForm = CreateFormRequest.builder()
                                .name("Leave Form V1")
                                .schemaData(schema)
                                .build();

                // Create new form version (default active)
                MvcResult result = mockMvc.perform(post("/api/request-types/" + rt.getId() + "/forms")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createForm)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.version").value(1))
                                .andExpect(jsonPath("$.isActive").value(true))
                                .andReturn();

                String resStr = result.getResponse().getContentAsString();
                Long formId = objectMapper.readTree(resStr).get("id").asLong();

                // Retrieve active form - should return V1
                mockMvc.perform(get("/api/request-types/" + rt.getId() + "/form")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(formId))
                                .andExpect(jsonPath("$.version").value(1))
                                .andExpect(jsonPath("$.isActive").value(true));

                // Get detailed form version as ADMIN
                mockMvc.perform(get("/api/forms/" + formId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.name").value("Leave Form V1"));

                // Activate form
                mockMvc.perform(patch("/api/forms/" + formId + "/activate")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.isActive").value(true));

                // Retrieve active form now - should be successful
                mockMvc.perform(get("/api/request-types/" + rt.getId() + "/form")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(formId))
                                .andExpect(jsonPath("$.version").value(1))
                                .andExpect(jsonPath("$.isActive").value(true));

                // Create another form version (V2)
                CreateFormRequest createFormV2 = CreateFormRequest.builder()
                                .name("Leave Form V2")
                                .schemaData(schema)
                                .build();

                MvcResult resultV2 = mockMvc.perform(post("/api/request-types/" + rt.getId() + "/forms")
                                .header("Authorization", "Bearer " + adminToken)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(createFormV2)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.version").value(2))
                                .andExpect(jsonPath("$.isActive").value(true))
                                .andReturn();

                Long formV2Id = objectMapper.readTree(resultV2.getResponse().getContentAsString()).get("id").asLong();

                // Activate form V2
                mockMvc.perform(patch("/api/forms/" + formV2Id + "/activate")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.isActive").value(true));

                // Retrieve active form now - should be V2
                mockMvc.perform(get("/api/request-types/" + rt.getId() + "/form")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(formV2Id))
                                .andExpect(jsonPath("$.version").value(2));

                // Verify V1 is now inactive
                mockMvc.perform(get("/api/forms/" + formId)
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.isActive").value(false));
        }

        @Test
        void testGetRequestTypesWithFiltersAndPagination_Success() throws Exception {
                Category hr = categoryRepository.saveAndFlush(Category.builder().name("HR").isActive(true).build());
                Category finance = categoryRepository
                                .saveAndFlush(Category.builder().name("FINANCE").isActive(true).build());

                RequestType rt1 = RequestType.builder()
                                .code("LEAVE")
                                .name("Leave Request")
                                .category(hr)
                                .isActive(true)
                                .sortOrder(1)
                                .build();
                requestTypeRepository.saveAndFlush(rt1);

                RequestType rt2 = RequestType.builder()
                                .code("CLAIM")
                                .name("Claim Request")
                                .category(finance)
                                .isActive(true)
                                .sortOrder(2)
                                .build();
                requestTypeRepository.saveAndFlush(rt2);

                RequestType rt3 = RequestType.builder()
                                .code("TRAINING")
                                .name("Training Proposal")
                                .category(hr)
                                .isActive(false)
                                .sortOrder(3)
                                .build();
                requestTypeRepository.saveAndFlush(rt3);

                // 1. Search for "claim" -> should only return CLAIM (1 item)
                mockMvc.perform(get("/api/request-types?search=claim")
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(1))
                                .andExpect(jsonPath("$.content[0].code").value("CLAIM"));

                // 2. Filter category "HR" as Staff -> should only return LEAVE (1 item, since
                // TRAINING is inactive)
                mockMvc.perform(get("/api/request-types?categoryId=" + hr.getId())
                                .header("Authorization", "Bearer " + staffToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(1))
                                .andExpect(jsonPath("$.content[0].code").value("LEAVE"));

                // 3. Filter category "HR" as Admin (who can retrieve inactive ones) -> should
                // return both LEAVE and TRAINING (2 items)
                mockMvc.perform(get("/api/request-types?categoryId=" + hr.getId())
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(2))
                                .andExpect(jsonPath("$.content[0].code").value("LEAVE"))
                                .andExpect(jsonPath("$.content[1].code").value("TRAINING"));

                // 4. Pagination: page 0, size 1 for Admin -> should return LEAVE (first element
                // by sortOrder)
                mockMvc.perform(get("/api/request-types?page=0&size=1")
                                .header("Authorization", "Bearer " + adminToken))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.content.length()").value(1))
                                .andExpect(jsonPath("$.content[0].code").value("LEAVE"))
                                .andExpect(jsonPath("$.totalPages").value(3))
                                .andExpect(jsonPath("$.totalElements").value(3));
        }
}
