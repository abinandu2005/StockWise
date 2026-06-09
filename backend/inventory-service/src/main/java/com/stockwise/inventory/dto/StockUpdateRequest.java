package com.stockwise.inventory.dto;

import com.stockwise.inventory.model.StockLog;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Request DTO for stock IN / OUT / ADJUSTMENT operations. */
@Data
public class StockUpdateRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotNull(message = "Action type is required")
    private StockLog.ActionType actionType;  // IN, OUT, ADJUSTMENT

    @Min(value = 1, message = "Quantity must be at least 1")
    private int quantity;

    private String referenceId;  // PO number, SO number, etc.
    private String notes;
    private String warehouse;    // Name of the target warehouse (optional)
}
