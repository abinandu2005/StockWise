package com.stockwise.analytics.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** AuditLog — immutable record of every significant system action. */
@Document(collection = "audit_logs")
@Getter @Setter @NoArgsConstructor  @Builder
public class AuditLog {

    @Id
    private String id;

    private String action;        // e.g. "STOCK_UPDATED", "USER_REGISTERED"
    private String module;        // INVENTORY, AUTH, SALES, PURCHASE
    private String description;
    private String userId;
    private String userName;
    private String userRole;
    private String entityId;      // ID of the affected entity
    private String ipAddress;

    private LocalDateTime timestamp;

	public AuditLog(String id, String action, String module, String description, String userId, String userName,
			String userRole, String entityId, String ipAddress, LocalDateTime timestamp) {
		super();
		this.id = id;
		this.action = action;
		this.module = module;
		this.description = description;
		this.userId = userId;
		this.userName = userName;
		this.userRole = userRole;
		this.entityId = entityId;
		this.ipAddress = ipAddress;
		this.timestamp = timestamp;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}

	public String getAction() {
		return action;
	}

	public void setAction(String action) {
		this.action = action;
	}

	public String getModule() {
		return module;
	}

	public void setModule(String module) {
		this.module = module;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserRole() {
		return userRole;
	}

	public void setUserRole(String userRole) {
		this.userRole = userRole;
	}

	public String getEntityId() {
		return entityId;
	}

	public void setEntityId(String entityId) {
		this.entityId = entityId;
	}

	public String getIpAddress() {
		return ipAddress;
	}

	public void setIpAddress(String ipAddress) {
		this.ipAddress = ipAddress;
	}

	public LocalDateTime getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(LocalDateTime timestamp) {
		this.timestamp = timestamp;
	}
    
}
