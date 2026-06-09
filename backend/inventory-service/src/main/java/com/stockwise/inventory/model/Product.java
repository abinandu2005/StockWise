package com.stockwise.inventory.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Product document stored in MongoDB.
 * Contains pricing, stock level, category, and per-warehouse stock map.
 */
@Document(collection = "products")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Product {

    @Id
    private String id;

    @Indexed(unique = true)
    private String sku;

    private String barcode;

    private String productName;
    private String description;
    private String category;
    private String brand;

    private double price;
    private double costPrice;

    private int stockQuantity;
    private int reorderLevel;

    /** Per-warehouse stock breakdown: { warehouseName -> quantity } */
    private Map<String, Integer> warehouseStock;

    private String warehouseId;      // primary warehouse
    private String imageUrl;
    private String unit;             // pcs, kg, L, etc.

    private boolean isActive;

    /** Optional expiry date (ISO string: yyyy-MM-dd) for food/perishable products */
    private String expiryDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
