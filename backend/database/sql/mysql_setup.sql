CREATE DATABASE stockwise_auth;

USE stockwise_auth;

CREATE TABLE users (
    id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    password      VARCHAR(255)  NOT NULL,
    phone_number  VARCHAR(15),
    role          ENUM('ADMIN', 'PURCHASE_MANAGER', 'WAREHOUSE_STAFF') NOT NULL,
    is_active     TINYINT(1)    NOT NULL DEFAULT 1,
    created_at    DATETIME,
    updated_at    DATETIME
);

CREATE TABLE refresh_tokens (
    id          BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     BIGINT       NOT NULL,
    expires_at  DATETIME     NOT NULL,
    revoked     TINYINT(1)   NOT NULL DEFAULT 0,
    created_at  DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
