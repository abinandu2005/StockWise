package com.stockwise.salesdispatch.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/** ReturnOrder — tracks returned goods from a customer. */
@Document(collection = "return_orders")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReturnOrder {
    @Id
    private String id;

    private String salesOrderId;
    private String orderNumber;
    private String reason;
    private String returnStatus;   // REQUESTED, APPROVED, REJECTED, RECEIVED
    private List<SalesOrderItem> returnedItems;
    private String processedBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
