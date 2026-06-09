package com.stockwise.analytics.controller;

import com.stockwise.analytics.model.AuditLog;
import com.stockwise.analytics.model.Notification;
import com.stockwise.analytics.repository.AuditLogRepository;
import com.stockwise.analytics.repository.NotificationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Analytics, Reports & Notifications REST controller.
 * Provides dashboard metrics, audit logs, and notification endpoints.
 */
@RestController
@Tag(name = "Analytics & Reports", description = "Dashboard metrics, reports, audit logs, notifications")
public class AnalyticsController {

    private final AuditLogRepository auditLogRepository;
    private final NotificationRepository notificationRepository;

    @Autowired
    public AnalyticsController(AuditLogRepository auditLogRepository,
                               NotificationRepository notificationRepository) {
        this.auditLogRepository = auditLogRepository;
        this.notificationRepository = notificationRepository;
    }

    // ── Dashboard ──────────────────────────────────────────────────────────

    @GetMapping("/api/analytics/dashboard")
    @Operation(summary = "Get dashboard overview metrics")
    public ResponseEntity<Map<String, Object>> getDashboard() {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("totalAuditLogs", auditLogRepository.count());
        dashboard.put("generatedAt", LocalDateTime.now());
        dashboard.put("message", "Connect to respective services for full real-time metrics");
        return ResponseEntity.ok(dashboard);
    }

    // ── Audit Logs ────────────────────────────────────────────────────────

    @GetMapping("/api/analytics/audit-logs")
    @Operation(summary = "Get all audit logs with pagination")
    public ResponseEntity<Page<AuditLog>> getAuditLogs(@PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(auditLogRepository.findAll(pageable));
    }

    @PostMapping("/api/analytics/audit-logs")
    @Operation(summary = "Record an audit log entry")
    public ResponseEntity<AuditLog> createLog(
            @RequestBody AuditLog log,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "SYSTEM") String role,
            @RequestHeader(value = "X-User-Email", defaultValue = "") String email) {
        log.setUserId(userId);
        log.setUserRole(role);
        if (log.getUserName() == null || log.getUserName().isBlank()) {
            log.setUserName(email.isBlank() ? userId : email);
        }
        log.setTimestamp(LocalDateTime.now());
        return ResponseEntity.ok(auditLogRepository.save(log));
    }

    @DeleteMapping("/api/analytics/audit-logs")
    @Operation(summary = "Clear all audit logs")
    public ResponseEntity<Void> clearAuditLogs() {
        auditLogRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }

    // ── Notifications ─────────────────────────────────────────────────────

    @GetMapping("/api/notifications")
    @Operation(summary = "Get all notifications (optionally filtered by userId)")
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(required = false) String userId) {
        if (userId != null && !userId.isBlank()) {
            return ResponseEntity.ok(notificationRepository.findByUserIdOrderByCreatedAtDesc(userId));
        }
        return ResponseEntity.ok(notificationRepository.findAllByOrderByCreatedAtDesc());
    }

    @PostMapping("/api/notifications")
    @Operation(summary = "Create a new notification (persisted to MongoDB)")
    public ResponseEntity<Notification> createNotification(
            @RequestBody Notification notification,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId,
            @RequestHeader(value = "X-User-Email", defaultValue = "") String email) {
        if (notification.getUserId() == null || notification.getUserId().isBlank()) {
            notification.setUserId(userId);
        }
        if (notification.getUserName() == null || notification.getUserName().isBlank()) {
            notification.setUserName(email.isBlank() ? userId : email);
        }
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        return ResponseEntity.ok(notificationRepository.save(notification));
    }

    @PutMapping("/api/notifications/mark-read")
    @Operation(summary = "Mark all notifications as read for the current user")
    public ResponseEntity<Void> markAllRead(
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        List<Notification> userNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        userNotifs.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(userNotifs);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/api/notifications/{id}/read")
    @Operation(summary = "Mark a single notification as read")
    public ResponseEntity<Notification> markOneRead(@PathVariable String id) {
        return notificationRepository.findById(id).map(n -> {
            n.setRead(true);
            return ResponseEntity.ok(notificationRepository.save(n));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/notifications")
    @Operation(summary = "Clear all notifications for the current user")
    public ResponseEntity<Void> clearNotifications(
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        List<Notification> userNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(userNotifs);
        return ResponseEntity.noContent().build();
    }

    // ── Report Stubs ──────────────────────────────────────────────────────

    @GetMapping("/api/reports/stock-valuation")
    @Operation(summary = "Stock valuation report")
    public ResponseEntity<Map<String, Object>> stockValuation() {
        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "STOCK_VALUATION");
        report.put("method", "FIFO");
        report.put("generatedAt", LocalDateTime.now());
        report.put("note", "Integrate with inventory-service for product-level valuation");
        return ResponseEntity.ok(report);
    }

    @GetMapping("/api/reports/inventory-turnover")
    @Operation(summary = "Inventory turnover ratio report")
    public ResponseEntity<Map<String, Object>> inventoryTurnover() {
        Map<String, Object> report = new HashMap<>();
        report.put("reportType", "INVENTORY_TURNOVER");
        report.put("generatedAt", LocalDateTime.now());
        report.put("note", "Integrate with inventory & sales services for full calculation");
        return ResponseEntity.ok(report);
    }

    @PostMapping("/api/notifications/email")
    @Operation(summary = "Send an email notification")
    public ResponseEntity<Map<String, String>> sendEmail(@RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(Map.of(
                "status", "queued",
                "to", payload.getOrDefault("to", ""),
                "subject", payload.getOrDefault("subject", ""),
                "message", "Email notification queued successfully"
        ));
    }
}
