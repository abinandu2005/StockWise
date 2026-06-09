package com.stockwise.suppliercustomer.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/** Customer document — buyer information for sales orders. */
@Document(collection = "customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Customer {
    @Id
    private String id;

    private String customerName;
    private String email;
    private String phone;
    private String address;
    private String city;
    private String country;
    private String customerType;   // RETAIL, WHOLESALE, CORPORATE
    private boolean isActive;
    private double creditLimit;
    private String notes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
