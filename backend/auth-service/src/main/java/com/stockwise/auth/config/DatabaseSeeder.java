package com.stockwise.auth.config;

import com.stockwise.auth.entity.Role;
import com.stockwise.auth.entity.User;
import com.stockwise.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Automatically seeds the database with a default Admin account on startup
 * if no user with that email already exists.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdminUser();
        enableExistingUsers();
    }

    private void seedAdminUser() {
        String adminEmail = "abinandu2005@gmail.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("ABINANDU")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Abinandu@2005"))
                    .role(Role.ADMIN)
                    .phoneNumber("9487205045")
                    .isActive(true)
                    .enabled(true)
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully: {}", adminEmail);
        } else {
            log.info("Admin user already exists: {}", adminEmail);
        }
    }

    private void enableExistingUsers() {
        // Threshold date/time for existing users (before the deployment of the verification module)
        LocalDateTime threshold = LocalDateTime.of(2026, 6, 10, 15, 30, 0);
        userRepository.findAll().forEach(user -> {
            // If the user was created before the verification feature release (or doesn't have a creation date),
            // we auto-enable them so they don't get forced to verify.
            if ((user.getCreatedAt() == null || user.getCreatedAt().isBefore(threshold)) && !user.isEnabled()) {
                user.setEnabled(true);
                userRepository.save(user);
                log.info("Automatically enabled existing pre-verification user: {}", user.getEmail());
            }
        });
    }
}
