package com.stockwise.purchaseorder.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * PurchaseOrder document.
 * Tracks supplier purchase orders from DRAFT through COMPLETED.
 */
@Document(collection = "purchase_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrder {

    @Id
    private String id;

    private String poNumber;          // auto-generated e.g. PO-20240601-0001
    private String supplierId;
    private String supplierName;
    private String supplierEmail;

    private LocalDate orderDate;
    private LocalDate expectedDeliveryDate;

    private POStatus status;
    private double totalAmount;

    private List<PurchaseOrderItem> items;
    private String notes;

    private String createdBy;         // userId
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public enum POStatus {
        DRAFT, SENT, PARTIALLY_RECEIVED, COMPLETED, CANCELLED
    }
}
