package com.stockwise.salesdispatch.model;

import lombok.*;

/** Embedded line item for a SalesOrder. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SalesOrderItem {
    private String productId;
    private String productName;
    private String sku;
    private int quantity;
    private double unitPrice;
    private double subtotal;
}
