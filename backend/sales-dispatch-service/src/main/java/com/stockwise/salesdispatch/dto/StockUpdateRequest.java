package com.stockwise.salesdispatch.dto;

import lombok.Data;

/** Stock deduction DTO for inter-service call. */
@Data
public class StockUpdateRequest {
    private String productId;
    private String actionType; // "OUT"
    private int quantity;
    private String referenceId;
    private String notes;
}
