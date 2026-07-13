package com.stockwise.auth.service;

import com.stockwise.auth.dto.UserResponse;
import com.stockwise.auth.entity.Role;
import com.stockwise.auth.entity.User;
import com.stockwise.auth.exception.EmailAlreadyExistsException;
import com.stockwise.auth.exception.ResourceNotFoundException;
import com.stockwise.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** User management service for admin CRUD operations. */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(this::toResponse);
    }

    public UserResponse getUserById(Long id) {
        return toResponse(findOrThrow(id));
    }

    /** Admin-only: create a user directly, bypassing email OTP (enabled + active from the start). */
    @Transactional
    public UserResponse adminCreateUser(com.stockwise.auth.dto.UpdateUserRequest request) {
        String email = request.getEmail();
        if (email == null || email.isBlank()) throw new IllegalArgumentException("Email is required");
        if (userRepository.existsByEmail(email)) throw new EmailAlreadyExistsException(email);

        String password = request.getPassword();
        if (password == null || password.isBlank()) password = "StockWise@123";

        Role role = Role.WAREHOUSE_STAFF;
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try { role = Role.valueOf(request.getRole().toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        boolean isActive = request.getIsActive() != null ? request.getIsActive() :
                           request.getActive() != null ? request.getActive() : true;

        User user = User.builder()
                .fullName(request.getFullName() != null ? request.getFullName() : "New User")
                .email(email)
                .password(passwordEncoder.encode(password))
                .phoneNumber(request.getPhoneNumber() != null ? request.getPhoneNumber() : "")
                .role(role)
                .isActive(isActive)
                .enabled(true)   // admin-created users skip email verification
                .employeeId(request.getEmployeeId())
                .companyName(request.getCompanyName())
                .build();

        User saved = userRepository.save(user);
        log.info("Admin created user directly: {} ({})", saved.getEmail(), saved.getRole());
        return toResponse(saved);
    }

    @Transactional
    public UserResponse updateUser(Long id, com.stockwise.auth.dto.UpdateUserRequest request) {
        User user = findOrThrow(id);
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhoneNumber() != null) user.setPhoneNumber(request.getPhoneNumber());
        if (request.getIsActive() != null) user.setActive(request.getIsActive());
        if (request.getActive() != null) user.setActive(request.getActive());
        if (request.getEnabled() != null) user.setEnabled(request.getEnabled());
        if (request.getEmployeeId() != null) user.setEmployeeId(request.getEmployeeId());
        if (request.getCompanyName() != null) user.setCompanyName(request.getCompanyName());
        if (request.getRole() != null && !request.getRole().isBlank()) {
            try {
                user.setRole(com.stockwise.auth.entity.Role.valueOf(request.getRole().toUpperCase()));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role value: {}", request.getRole());
            }
        }
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(request.getPassword()));
        }
        if (request.getEmail() != null) {
            if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new com.stockwise.auth.exception.EmailAlreadyExistsException(request.getEmail());
            }
            user.setEmail(request.getEmail());
        }
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id) {
        User user = findOrThrow(id);
        userRepository.delete(user);
        log.info("User {} deleted", id);
    }

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    private UserResponse toResponse(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phoneNumber(u.getPhoneNumber())
                .role(u.getRole().name())
                .isActive(u.isActive())
                .enabled(u.isEnabled())
                .employeeId(u.getEmployeeId())
                .companyName(u.getCompanyName())
                .lastLogin(u.getLastLogin())
                .createdAt(u.getCreatedAt())
                .updatedAt(u.getUpdatedAt())
                .build();
    }
}
