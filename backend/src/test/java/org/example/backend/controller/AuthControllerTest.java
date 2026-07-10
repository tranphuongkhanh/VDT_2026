package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.dto.*;
import org.example.backend.dto.request.ForgotPasswordRequest;
import org.example.backend.dto.request.LoginRequest;
import org.example.backend.dto.request.RefreshRequest;
import org.example.backend.dto.request.ResetPasswordRequest;
import org.example.backend.entity.*;
import org.example.backend.repository.*;
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
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

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
        private RefreshTokenRepository refreshTokenRepository;

        @Autowired
        private PasswordResetTokenRepository passwordResetTokenRepository;

        @Autowired
        private DepartmentRepository departmentRepository;

        @Autowired
        private PasswordEncoder passwordEncoder;

        @Autowired
        private ObjectMapper objectMapper;

        private User testUser;
        private Role testRole;

        @BeforeEach
        void setUp() {
                testDatabaseCleanup.clearDatabase();

                // Create test role
                testRole = Role.builder()
                                .code("ADMIN")
                                .name("Administrator")
                                .isSystem(true)
                                .build();
                testRole = roleRepository.save(testRole);

                // Create test user
                testUser = User.builder()
                                .username("testuser")
                                .email("testuser@example.com")
                                .passwordHash(passwordEncoder.encode("Password123"))
                                .fullName("Test User")
                                .isActive(true)
                                .employeeCode("EMP001")
                                .build();
                testUser = userRepository.save(testUser);

                // Map role
                UserRole userRole = UserRole.builder()
                                .id(new UserRoleId(testUser.getId(), testRole.getId()))
                                .user(testUser)
                                .role(testRole)
                                .grantedAt(LocalDateTime.now())
                                .build();
                userRoleRepository.save(userRole);
        }

        @Test
        void testLogin_Success() throws Exception {
                LoginRequest loginRequest = LoginRequest.builder()
                                .username("testuser")
                                .password("Password123")
                                .build();

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                                .andExpect(jsonPath("$.user.username").value("testuser"))
                                .andExpect(jsonPath("$.user.email").value("testuser@example.com"))
                                .andExpect(jsonPath("$.user.roles[0]").value("ADMIN"));
        }

        @Test
        void testLogin_Failure() throws Exception {
                LoginRequest loginRequest = LoginRequest.builder()
                                .username("testuser")
                                .password("WrongPassword")
                                .build();

                mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().is4xxClientError());
        }

        @Test
        void testRefresh_Success() throws Exception {
                // First login to get a refresh token
                LoginRequest loginRequest = LoginRequest.builder()
                                .username("testuser")
                                .password("Password123")
                                .build();

                MvcResult result = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn();

                String responseString = result.getResponse().getContentAsString();
                LoginResponse loginResponse = objectMapper.readValue(responseString, LoginResponse.class);

                // Perform refresh
                RefreshRequest refreshRequest = RefreshRequest.builder()
                                .refreshToken(loginResponse.getRefreshToken())
                                .build();

                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(refreshRequest)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
        }

        @Test
        void testLogout_Success() throws Exception {
                // First login to get a refresh token
                LoginRequest loginRequest = LoginRequest.builder()
                                .username("testuser")
                                .password("Password123")
                                .build();

                MvcResult result = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginRequest)))
                                .andExpect(status().isOk())
                                .andReturn();

                String responseString = result.getResponse().getContentAsString();
                LoginResponse loginResponse = objectMapper.readValue(responseString, LoginResponse.class);

                RefreshRequest logoutRequest = RefreshRequest.builder()
                                .refreshToken(loginResponse.getRefreshToken())
                                .build();

                // Perform logout with Bearer token
                mockMvc.perform(post("/api/auth/logout")
                                .header("Authorization", "Bearer " + loginResponse.getAccessToken())
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(logoutRequest)))
                                .andExpect(status().isOk());

                // Try to refresh with the logged out token - should fail
                mockMvc.perform(post("/api/auth/refresh")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(logoutRequest)))
                                .andExpect(status().is4xxClientError());
        }

        @Test
        void testForgotPassword_Success() throws Exception {
                ForgotPasswordRequest request = ForgotPasswordRequest.builder()
                                .email("testuser@example.com")
                                .build();

                mockMvc.perform(post("/api/auth/forgot-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());

                // Verify that a token was generated in database
                List<PasswordResetToken> tokens = passwordResetTokenRepository.findAll();
                assertFalse(tokens.isEmpty());
                assertEquals(testUser.getId(), tokens.get(0).getUser().getId());
        }

        @Test
        void testResetPassword_Success() throws Exception {
                // Generate a token
                PasswordResetToken resetToken = PasswordResetToken.builder()
                                .token("valid-reset-token")
                                .user(testUser)
                                .expiresAt(LocalDateTime.now().plusHours(1))
                                .build();
                passwordResetTokenRepository.save(resetToken);

                ResetPasswordRequest request = ResetPasswordRequest.builder()
                                .token("valid-reset-token")
                                .newPassword("NewSecurePassword123")
                                .build();

                mockMvc.perform(post("/api/auth/reset-password")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(request)))
                                .andExpect(status().isOk());

                // Verify password changed
                Optional<User> updatedUserOpt = userRepository.findByUsername("testuser");
                assertTrue(updatedUserOpt.isPresent());
                assertTrue(passwordEncoder.matches("NewSecurePassword123", updatedUserOpt.get().getPasswordHash()));
        }
}
