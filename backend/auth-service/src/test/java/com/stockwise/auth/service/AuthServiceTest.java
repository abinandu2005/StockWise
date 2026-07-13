package com.stockwise.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.stockwise.auth.dto.LoginRequest;
import com.stockwise.auth.dto.RegisterRequest;
import com.stockwise.auth.entity.Role;
import com.stockwise.auth.entity.User;
import com.stockwise.auth.entity.EmailVerificationOtp;
import com.stockwise.auth.entity.PasswordResetOtp;
import com.stockwise.auth.exception.EmailAlreadyExistsException;
import com.stockwise.auth.exception.OtpException;
import java.time.LocalDateTime;
import com.stockwise.auth.repository.EmailVerificationOtpRepository;
import com.stockwise.auth.repository.PasswordResetOtpRepository;
import com.stockwise.auth.repository.RefreshTokenRepository;
import com.stockwise.auth.repository.UserRepository;
import com.stockwise.auth.security.JwtTokenProvider;
import com.stockwise.auth.service.EmailService;

/**
 * Unit tests for AuthService using JUnit 5 + Mockito.
 * Tests registration, login, and error cases in isolation.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RefreshTokenRepository refreshTokenRepository;
    @Mock private EmailVerificationOtpRepository emailVerificationOtpRepository;
    @Mock private PasswordResetOtpRepository passwordResetOtpRepository;
    @Mock private EmailService emailService;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;

    @InjectMocks private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(1L)
                .fullName("Test Admin")
                .email("admin@stockwise.com")
                .password("$2a$12$encodedPassword")
                .role(Role.ADMIN)
                .isActive(true)
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("register — should save and return user when email is new")
    void register_success() {
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Test Admin");
        request.setEmail("admin@stockwise.com");
        request.setPassword("password123");
        request.setRole("ADMIN");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$2a$12$hashed");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        var result = authService.register(request);

        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("admin@stockwise.com");
        assertThat(result.getRole()).isEqualTo("ADMIN");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register — should throw when email already exists")
    void register_duplicateEmail_throws() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("admin@stockwise.com");

        when(userRepository.existsByEmail("admin@stockwise.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(EmailAlreadyExistsException.class)
                .hasMessageContaining("admin@stockwise.com");
    }

    @Test
    @DisplayName("login — should return tokens when credentials are valid")
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@stockwise.com");
        request.setPassword("admin123");

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("admin123", testUser.getPassword())).thenReturn(true);
        when(jwtTokenProvider.generateAccessToken(any(), any(), any())).thenReturn("mock.jwt.token");
        when(jwtTokenProvider.getAccessTokenExpiryMs()).thenReturn(900000L);
        when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        var result = authService.login(request);

        assertThat(result.getAccessToken()).isEqualTo("mock.jwt.token");
        assertThat(result.getRefreshToken()).isNotBlank();
        assertThat(result.getUser().getEmail()).isEqualTo("admin@stockwise.com");
    }

    @Test
    @DisplayName("login — should throw BadCredentialsException when password is wrong")
    void login_wrongPassword_throws() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@stockwise.com");
        request.setPassword("wrongpass");

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongpass", testUser.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("login — should throw when account is inactive")
    void login_inactiveUser_throws() {
        testUser.setActive(false);
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@stockwise.com");
        request.setPassword("admin123");

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("deactivated");
    }

    @Test
    @DisplayName("login — should throw when account is unverified (disabled)")
    void login_unverifiedUser_throws() {
        testUser.setEnabled(false);
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@stockwise.com");
        request.setPassword("admin123");

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("verify your email");
    }

    @Test
    @DisplayName("verifyEmail — should verify and enable user when OTP is valid")
    void verifyEmail_success() {
        testUser.setEnabled(false);
        EmailVerificationOtp otp = EmailVerificationOtp.builder()
                .email("admin@stockwise.com")
                .otp("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(emailVerificationOtpRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(otp));

        authService.verifyEmail("admin@stockwise.com", "123456");

        assertThat(testUser.isEnabled()).isTrue();
        verify(userRepository).save(testUser);
        verify(emailVerificationOtpRepository).delete(otp);
    }

    @Test
    @DisplayName("verifyEmail — should throw OtpException when OTP is incorrect")
    void verifyEmail_incorrectOtp_throws() {
        testUser.setEnabled(false);
        EmailVerificationOtp otp = EmailVerificationOtp.builder()
                .email("admin@stockwise.com")
                .otp("123456")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(emailVerificationOtpRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> authService.verifyEmail("admin@stockwise.com", "654321"))
                .isInstanceOf(OtpException.class)
                .hasMessageContaining("Incorrect OTP");
    }

    @Test
    @DisplayName("verifyEmail — should throw OtpException when OTP is expired")
    void verifyEmail_expiredOtp_throws() {
        testUser.setEnabled(false);
        EmailVerificationOtp otp = EmailVerificationOtp.builder()
                .email("admin@stockwise.com")
                .otp("123456")
                .expiryTime(LocalDateTime.now().minusMinutes(5))
                .build();

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(emailVerificationOtpRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(otp));

        assertThatThrownBy(() -> authService.verifyEmail("admin@stockwise.com", "123456"))
                .isInstanceOf(OtpException.class)
                .hasMessageContaining("expired");
    }

    @Test
    @DisplayName("forgotPassword — should generate and send OTP when email exists")
    void forgotPassword_success() {
        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(passwordResetOtpRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.empty());

        authService.forgotPassword("admin@stockwise.com");

        verify(passwordResetOtpRepository).save(any(PasswordResetOtp.class));
        verify(emailService).sendPasswordResetOtp(anyString(), anyString());
    }

    @Test
    @DisplayName("resetPassword — should update password and delete OTP when OTP is valid")
    void resetPassword_success() {
        PasswordResetOtp otp = PasswordResetOtp.builder()
                .email("admin@stockwise.com")
                .otp("654321")
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .build();

        when(userRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(testUser));
        when(passwordResetOtpRepository.findByEmail("admin@stockwise.com")).thenReturn(Optional.of(otp));
        when(passwordEncoder.encode("newPassword123")).thenReturn("newHashedPassword");

        authService.resetPassword("admin@stockwise.com", "654321", "newPassword123");

        assertThat(testUser.getPassword()).isEqualTo("newHashedPassword");
        verify(userRepository).save(testUser);
        verify(passwordResetOtpRepository).delete(otp);
    }
}
