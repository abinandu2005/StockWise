package com.stockwise.auth.dto;

import lombok.Data;

/** DTO for updating a user's non-sensitive fields. */
@Data
public class UpdateUserRequest {
    private String fullName;
    private String email;
    private String phoneNumber;
    private Boolean isActive;
    private Boolean active;
    private String role;       // optional role change (ADMIN, PURCHASE_MANAGER, WAREHOUSE_STAFF)
    private String password;   // optional password reset
    private String employeeId;
    private String companyName;
}
