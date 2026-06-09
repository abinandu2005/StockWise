-- ============================================================
-- StockWise — Seed Default Admin User
-- Run this in MySQL against the stockwise_auth database
-- Password: Abinandu@2005  (BCrypt, cost=10)
-- ============================================================

USE stockwise_auth;

INSERT INTO users (full_name, email, password, phone_number, role, is_active, created_at, updated_at)
VALUES (
    'ABINANDU',
    'abinandu2005@gmail.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq',
    '9487205045',
    'ADMIN',
    1,
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    password   = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWq',
    is_active  = 1,
    role       = 'ADMIN',
    updated_at = NOW();

SELECT id, full_name, email, role, is_active FROM users WHERE email = 'abinandu2005@gmail.com';
