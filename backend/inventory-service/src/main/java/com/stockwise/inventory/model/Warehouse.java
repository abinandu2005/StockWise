package com.stockwise.inventory.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** Warehouse document — physical storage location with capacity info. */
@Document(collection = "warehouses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Warehouse {

    @Id
    private String id;

    private String warehouseName;
    private String address;
    private String city;
    private String state;
    private String country;
    private String managerName;
    private String managerEmail;
    private int capacity;
    private boolean isActive;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
