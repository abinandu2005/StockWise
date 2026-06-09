package com.stockwise.auth.exception;

/** Thrown when a user tries to register with an already existing email. */
public class EmailAlreadyExistsException extends RuntimeException {
    public EmailAlreadyExistsException(String email) {
        super("User with email '" + email + "' already exists.");
    }
}
