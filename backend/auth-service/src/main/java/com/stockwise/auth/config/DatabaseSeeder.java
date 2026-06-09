package com.stockwise.auth.config;

import com.stockwise.auth.entity.Role;
import com.stockwise.auth.entity.User;
import com.stockwise.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

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
                    .build();
            userRepository.save(admin);
            log.info("Default admin user created successfully: {}", adminEmail);
        } else {
            log.info("Admin user already exists: {}", adminEmail);
        }
    }
}
