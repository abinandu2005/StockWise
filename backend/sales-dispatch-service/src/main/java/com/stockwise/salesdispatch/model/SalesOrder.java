package com.stockwise.salesdispatch.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/** SalesOrder document — outbound customer order. */
@Document(collection = "sales_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalesOrder {

    @Id
    private String id;

    private String orderNumber;
    private String customerId;
    private String customerName;
    private String customerEmail;

    private OrderStatus status;
    private double totalAmount;

    private List<SalesOrderItem> items;
    private String notes;
    private String trackingNumber;

    private String createdBy;
    private LocalDateTime orderDate;
    private LocalDateTime shippedDate;
    private LocalDateTime deliveredDate;

    public enum OrderStatus {
        PENDING, PROCESSING, SHIPPED, DELIVERED, RETURNED, CANCELLED
    }
}
