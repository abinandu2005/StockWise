package com.stockwise.inventory.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

/** Request DTO for creating or updating a product. */
@Data
public class ProductRequest {
    private String sku;
    private String barcode;

    @NotBlank(message = "Product name is required")
    private String productName;

    private String description;
    private String category;
    private String brand;

    @Min(value = 0, message = "Price cannot be negative")
    private double price;
    private double costPrice;

    @Min(value = 0, message = "Stock quantity cannot be negative")
    private int stockQuantity;

    private int reorderLevel;
    private String warehouseId;
    private String unit;

    /** Optional expiry date for food/perishable products (yyyy-MM-dd) */
    private String expiryDate;

    /** Per-warehouse stock breakdown map */
    private Map<String, Integer> warehouseStock;
}
