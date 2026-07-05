package org.example.backend.service;

import org.example.backend.dto.*;
import org.example.backend.dto.request.ChangePasswordRequest;
import org.example.backend.dto.request.ForgotPasswordRequest;
import org.example.backend.dto.request.LoginRequest;
import org.example.backend.dto.request.RefreshRequest;
import org.example.backend.dto.request.ResetPasswordRequest;
import org.example.backend.entity.PasswordResetToken;
import org.example.backend.entity.RefreshToken;
import org.example.backend.entity.User;
import org.example.backend.repository.PasswordResetTokenRepository;
import org.example.backend.repository.RefreshTokenRepository;
import org.example.backend.repository.UserRepository;
import org.example.backend.repository.UserRoleRepository;
import org.example.backend.security.CustomUserDetails;
import org.example.backend.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

        private static final Logger log = LoggerFactory.getLogger(AuthService.class);

        private final AuthenticationManager authenticationManager;
        private final UserRepository userRepository;
        private final UserRoleRepository userRoleRepository;
        private final RefreshTokenRepository refreshTokenRepository;
        private final PasswordResetTokenRepository passwordResetTokenRepository;
        private final JwtTokenProvider tokenProvider;
        private final PasswordEncoder passwordEncoder;

        @Value("${app.jwt.refresh-expiration-ms}")
        private long refreshExpirationInMs;

        public AuthService(
                        AuthenticationManager authenticationManager,
                        UserRepository userRepository,
                        UserRoleRepository userRoleRepository,
                        RefreshTokenRepository refreshTokenRepository,
                        PasswordResetTokenRepository passwordResetTokenRepository,
                        JwtTokenProvider tokenProvider,
                        PasswordEncoder passwordEncoder) {
                this.authenticationManager = authenticationManager;
                this.userRepository = userRepository;
                this.userRoleRepository = userRoleRepository;
                this.refreshTokenRepository = refreshTokenRepository;
                this.passwordResetTokenRepository = passwordResetTokenRepository;
                this.tokenProvider = tokenProvider;
                this.passwordEncoder = passwordEncoder;
        }

        @Transactional
        public LoginResponse login(LoginRequest request) {
                // We find the user by username or email first to obtain their canonical
                // username
                User user = userRepository.findByUsername(request.getUsername())
                                .or(() -> userRepository.findByEmail(request.getUsername()))
                                .orElseThrow(() -> new BadCredentialsException("Invalid username/email or password"));

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword()));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                // Update last login timestamp
                user.setLastLoginAt(LocalDateTime.now());
                userRepository.save(user);

                // Generate tokens
                String accessToken = tokenProvider.generateAccessToken(user.getUsername());
                String refreshTokenString = tokenProvider.generateRefreshToken(user.getUsername());

                // Save refresh token
                RefreshToken refreshToken = RefreshToken.builder()
                                .user(user)
                                .token(refreshTokenString)
                                .expiresAt(LocalDateTime.now().plusWeeks(1))
                                .build();
                refreshTokenRepository.save(refreshToken);

                List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                                .map(ur -> ur.getRole().getCode())
                                .toList();

                return LoginResponse.builder()
                                .accessToken(accessToken)
                                .refreshToken(refreshTokenString)
                                .user(LoginResponse.UserInfo.builder()
                                                .id(user.getId())
                                                .username(user.getUsername())
                                                .email(user.getEmail())
                                                .fullName(user.getFullName())
                                                .roles(roles)
                                                .build())
                                .build();
        }

        @Transactional
        public LoginResponse refresh(RefreshRequest request) {
                String tokenStr = request.getRefreshToken();
                RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

                if (refreshToken.getRevokedAt() != null) {
                        throw new BadCredentialsException("Refresh token has been revoked");
                }

                if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                        throw new BadCredentialsException("Refresh token has expired");
                }

                User user = refreshToken.getUser();

                // Refresh token rotation: revoke current one, issue new pair
                refreshToken.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(refreshToken);

                String newAccessToken = tokenProvider.generateAccessToken(user.getUsername());
                String newRefreshTokenString = tokenProvider.generateRefreshToken(user.getUsername());

                RefreshToken newRefreshToken = RefreshToken.builder()
                                .user(user)
                                .token(newRefreshTokenString)
                                .expiresAt(LocalDateTime.now().plusWeeks(1))
                                .build();
                refreshTokenRepository.save(newRefreshToken);

                List<String> roles = userRoleRepository.findByUserId(user.getId()).stream()
                                .map(ur -> ur.getRole().getCode())
                                .toList();

                return LoginResponse.builder()
                                .accessToken(newAccessToken)
                                .refreshToken(newRefreshTokenString)
                                .user(LoginResponse.UserInfo.builder()
                                                .id(user.getId())
                                                .username(user.getUsername())
                                                .email(user.getEmail())
                                                .fullName(user.getFullName())
                                                .roles(roles)
                                                .build())
                                .build();
        }

        @Transactional
        public void logout(RefreshRequest request) {
                String tokenStr = request.getRefreshToken();
                RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                                .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

                refreshToken.setRevokedAt(LocalDateTime.now());
                refreshTokenRepository.save(refreshToken);
        }

        @Transactional
        public void changePassword(ChangePasswordRequest request) {
                Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
                if (authentication == null || !authentication.isAuthenticated()
                                || !(authentication.getPrincipal() instanceof CustomUserDetails userDetails)) {
                        throw new BadCredentialsException("User not authenticated");
                }

                User user = userRepository.findById(userDetails.getId())
                                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

                if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                        throw new BadCredentialsException("Incorrect old password");
                }

                user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);

                // Revoke all refresh tokens for this user on password change for security
                refreshTokenRepository.deleteByUser_Id(user.getId());
        }

        @Transactional
        public void forgotPassword(ForgotPasswordRequest request) {
                User user = userRepository.findByEmail(request.getEmail())
                                .orElseThrow(() -> new UsernameNotFoundException(
                                                "No user found with email: " + request.getEmail()));

                String token = UUID.randomUUID().toString();
                PasswordResetToken resetToken = PasswordResetToken.builder()
                                .user(user)
                                .token(token)
                                .expiresAt(LocalDateTime.now().plusHours(24))
                                .build();

                passwordResetTokenRepository.save(resetToken);

                // MOCK EMAIL SENDING
                String resetLink = "http://localhost:8080/api/auth/reset-password?token=" + token;
                log.info("Password Reset requested for user: {}", user.getEmail());
                log.info("Click the following link to reset password (valid for 24h):");
                log.info(resetLink);
        }

        @Transactional
        public void resetPassword(ResetPasswordRequest request) {
                PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                                .orElseThrow(() -> new BadCredentialsException("Invalid password reset token"));

                if (resetToken.getUsedAt() != null) {
                        throw new BadCredentialsException("Token has already been used");
                }

                if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                        throw new BadCredentialsException("Token has expired");
                }

                User user = resetToken.getUser();
                user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);

                resetToken.setUsedAt(LocalDateTime.now());
                passwordResetTokenRepository.save(resetToken);

                // Revoke all refresh tokens for security
                refreshTokenRepository.deleteByUser_Id(user.getId());
        }
}
