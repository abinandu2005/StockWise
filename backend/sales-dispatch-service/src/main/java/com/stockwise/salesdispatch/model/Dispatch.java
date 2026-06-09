package com.stockwise.salesdispatch.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** Dispatch record linked to a confirmed SalesOrder. */
@Document(collection = "dispatches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Dispatch {
    @Id
    private String id;

    private String salesOrderId;
    private String orderNumber;
    private LocalDateTime dispatchDate;
    private String trackingNumber;
    private String carrier;
    private String status;   // PENDING, DISPATCHED, DELIVERED
    private String dispatchedBy;
    private LocalDateTime createdAt;
}
