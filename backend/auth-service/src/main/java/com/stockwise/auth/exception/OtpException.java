package com.stockwise.auth.exception;

/**
 * Exception thrown when OTP validation fails (e.g. expired, invalid, or already used).
 */
public class OtpException extends RuntimeException {
    public OtpException(String message) {
        super(message);
    }
}
