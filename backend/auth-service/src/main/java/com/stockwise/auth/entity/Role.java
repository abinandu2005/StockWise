package com.stockwise.auth.entity;

/**
 * Roles supported in StockWise.
 * ADMIN        — full system access
 * PURCHASE_MANAGER — manages suppliers, POs, and analytics
 * WAREHOUSE_STAFF  — manages stock and inventory operations
 */
public enum Role {
    ADMIN,
    PURCHASE_MANAGER,
    WAREHOUSE_STAFF
}
