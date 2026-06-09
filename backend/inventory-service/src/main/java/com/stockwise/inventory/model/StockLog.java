package com.stockwise.inventory.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/**
 * StockLog — audit trail for every inventory movement.
 * Tracks IN (receive), OUT (dispatch), and ADJUSTMENT events.
 */
@Document(collection = "stock_logs")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StockLog {

    @Id
    private String id;

    @Indexed
    private String productId;
    private String productName;
    private String warehouseId;

    private ActionType actionType;

    private int quantity;
    private int previousStock;
    private int updatedStock;

    private String updatedBy;       // userId from JWT header
    private String referenceId;     // PO/SO number for traceability
    private String notes;

    private LocalDateTime timestamp;

    public enum ActionType {
        IN, OUT, ADJUSTMENT
    }
}
