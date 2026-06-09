package com.stockwise.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** DTO for refreshing an access token using a valid refresh token. */
@Data
public class RefreshTokenRequest {
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
}
