package com.stockwise.suppliercustomer.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

/** Supplier document — vendor details and pricing tier. */
@Document(collection = "suppliers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Supplier {
    @Id
    private String id;

    private String supplierName;
    private String contactPerson;

    @Indexed(unique = true)
    private String email;

    private String phone;
    private String address;
    private String city;
    private String country;
    private String pricingTier;    // STANDARD, PREFERRED, EXCLUSIVE
    private String taxId;
    private String website;
    private boolean isActive;
    private double rating;         // 0.0 - 5.0 performance rating
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
