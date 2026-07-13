package com.stockwise.auth.service;

import com.stockwise.auth.dto.*;
import com.stockwise.auth.entity.EmailVerificationOtp;
import com.stockwise.auth.entity.PasswordResetOtp;
import com.stockwise.auth.entity.RefreshToken;
import com.stockwise.auth.entity.Role;
import com.stockwise.auth.entity.User;
import com.stockwise.auth.exception.EmailAlreadyExistsException;
import com.stockwise.auth.exception.ResourceNotFoundException;
import com.stockwise.auth.exception.OtpException;
import com.stockwise.auth.repository.EmailVerificationOtpRepository;
import com.stockwise.auth.repository.PasswordResetOtpRepository;
import com.stockwise.auth.repository.RefreshTokenRepository;
import com.stockwise.auth.repository.UserRepository;
import com.stockwise.auth.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Core authentication service.
 * Handles registration, login, logout, and token refresh.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationOtpRepository emailVerificationOtpRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${jwt.refresh-token-expiry-days}")
    private long refreshTokenExpiryDays;

    private String generateOtp() {
        java.security.SecureRandom random = new java.security.SecureRandom();
        int num = 100000 + random.nextInt(900000);
        return String.valueOf(num);
    }

    /** Register a new user account. */
    @Transactional
    public UserResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException(request.getEmail());
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phoneNumber(request.getPhoneNumber())
                .role(Role.valueOf(request.getRole()))
                .isActive(false)   // Requires admin approval after email verification
                .enabled(false)    // Requires email OTP verification first
                .employeeId(request.getEmployeeId())
                .companyName(request.getCompanyName())
                .build();

        User saved = userRepository.save(user);
        log.info("New user registered (unverified): {} ({})", saved.getEmail(), saved.getRole());

        // Generate and save verification OTP
        String otp = generateOtp();
        EmailVerificationOtp verificationOtp = emailVerificationOtpRepository.findByEmail(saved.getEmail())
                .orElse(new EmailVerificationOtp());
        
        verificationOtp.setEmail(saved.getEmail());
        verificationOtp.setOtp(otp);
        verificationOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        emailVerificationOtpRepository.save(verificationOtp);

        // Send verification OTP via email
        try {
            emailService.sendVerificationOtp(saved.getEmail(), otp);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", saved.getEmail(), e.getMessage());
            throw new RuntimeException("Registration successful but failed to send verification email. Please request a resend.");
        }

        return toUserResponse(saved);
    }

    /** Authenticate user and issue JWT + refresh token. */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!user.isEnabled()) {
            throw new BadCredentialsException("Please verify your email before logging in.");
        }

        if (!user.isActive()) {
            throw new BadCredentialsException("Your account is pending admin approval. Please contact your administrator.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtTokenProvider.generateAccessToken(
                String.valueOf(user.getId()), user.getEmail(), user.getRole().name());

        String rawRefreshToken = UUID.randomUUID().toString();
        refreshTokenRepository.revokeAllUserTokens(user);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawRefreshToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .build();
        refreshTokenRepository.save(refreshToken);

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiryMs() / 1000)
                .user(toUserResponse(user))
                .build();
    }

    /** Revoke all refresh tokens for the user (logout). */
    @Transactional
    public void logout(String userId) {
        userRepository.findById(Long.valueOf(userId))
                .ifPresent(refreshTokenRepository::revokeAllUserTokens);
        log.info("User {} logged out", userId);
    }

    /** Issue a new access token from a valid refresh token. */
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken token = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));

        if (token.isRevoked()) {
            throw new RuntimeException("Refresh token has been revoked");
        }
        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token has expired");
        }

        User user = token.getUser();
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                String.valueOf(user.getId()), user.getEmail(), user.getRole().name());

        // Rotate refresh token
        token.setRevoked(true);
        String newRawToken = UUID.randomUUID().toString();
        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(newRawToken)
                .user(user)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiryMs() / 1000)
                .user(toUserResponse(user))
                .build();
    }

    /** Resend Verification OTP to user email. */
    @Transactional
    public void resendVerificationOtp(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEnabled()) {
            throw new OtpException("Email is already verified");
        }

        String otp = generateOtp();
        EmailVerificationOtp verificationOtp = emailVerificationOtpRepository.findByEmail(email)
                .orElse(new EmailVerificationOtp());

        verificationOtp.setEmail(email);
        verificationOtp.setOtp(otp);
        verificationOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        emailVerificationOtpRepository.save(verificationOtp);

        emailService.sendVerificationOtp(email, otp);
        log.info("Verification OTP resent to {}", email);
    }

    /** Verify email using the secure 6-digit OTP. */
    @Transactional
    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.isEnabled()) {
            throw new OtpException("Email is already verified");
        }

        EmailVerificationOtp verificationOtp = emailVerificationOtpRepository.findByEmail(email)
                .orElseThrow(() -> new OtpException("No verification request found for this email"));

        if (verificationOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpException("OTP has expired. Please request a new one.");
        }

        if (!verificationOtp.getOtp().equals(otp)) {
            throw new OtpException("Incorrect OTP. Please check and try again.");
        }

        // Enable user account
        user.setEnabled(true);
        userRepository.save(user);

        // Invalidate OTP (prevent reuse)
        emailVerificationOtpRepository.delete(verificationOtp);
        log.info("User email verified and account enabled: {}", email);
    }

    /** Request forgot password OTP. */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with this email address"));

        String otp = generateOtp();
        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmail(email)
                .orElse(new PasswordResetOtp());

        resetOtp.setEmail(email);
        resetOtp.setOtp(otp);
        resetOtp.setExpiryTime(LocalDateTime.now().plusMinutes(10));
        passwordResetOtpRepository.save(resetOtp);

        emailService.sendPasswordResetOtp(email, otp);
        log.info("Password reset OTP sent to {}", email);
    }

    /** Verify forgot password OTP. */
    @Transactional(readOnly = true)
    public void verifyForgotPasswordOtp(String email, String otp) {
        if (!userRepository.existsByEmail(email)) {
            throw new ResourceNotFoundException("No account registered with this email address");
        }

        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmail(email)
                .orElseThrow(() -> new OtpException("No password reset request found for this email"));

        if (resetOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpException("OTP has expired. Please request a new one.");
        }

        if (!resetOtp.getOtp().equals(otp)) {
            throw new OtpException("Incorrect OTP. Please check and try again.");
        }
    }

    /** Reset password using the verified OTP. */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account registered with this email address"));

        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmail(email)
                .orElseThrow(() -> new OtpException("No password reset request found for this email"));

        if (resetOtp.getExpiryTime().isBefore(LocalDateTime.now())) {
            throw new OtpException("OTP has expired. Please request a new one.");
        }

        if (!resetOtp.getOtp().equals(otp)) {
            throw new OtpException("Incorrect OTP. Please check and try again.");
        }

        // Reset password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Invalidate OTP (prevent reuse)
        passwordResetOtpRepository.delete(resetOtp);
        log.info("Password successfully reset and OTP invalidated for {}", email);

        // Send success notification email (best-effort — don't block on failure)
        try {
            emailService.sendPasswordResetSuccess(email);
        } catch (Exception e) {
            log.warn("Password reset success notification failed for {}: {}", email, e.getMessage());
        }
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole().name())
                .isActive(user.isActive())
                .enabled(user.isEnabled())
                .employeeId(user.getEmployeeId())
                .companyName(user.getCompanyName())
                .lastLogin(user.getLastLogin())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
