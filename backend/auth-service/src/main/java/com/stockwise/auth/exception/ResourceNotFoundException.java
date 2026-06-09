package com.stockwise.auth.exception;

/** Thrown when a requested resource is not found. */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " with id " + id + " not found.");
    }
}
