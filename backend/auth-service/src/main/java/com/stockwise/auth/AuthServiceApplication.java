package com.stockwise.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/**
 * Authentication & User Management Service.
 * Handles JWT auth, user registration/login, role-based access control.
 * Uses MySQL via Spring Data JPA.
 */
@SpringBootApplication
@EntityScan("com.stockwise.auth.entity")
@EnableJpaRepositories("com.stockwise.auth.repository")
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
