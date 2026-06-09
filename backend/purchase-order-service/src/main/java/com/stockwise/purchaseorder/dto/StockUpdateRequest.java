package com.stockwise.purchaseorder.dto;

import lombok.Data;

/** Mirrored StockUpdateRequest for inter-service call to inventory-service. */
@Data
public class StockUpdateRequest {
    private String productId;
    private String actionType; // "IN"
    private int quantity;
    private String referenceId;
    private String notes;
}
