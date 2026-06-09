package com.stockwise.purchaseorder.model;

import lombok.*;

/** Embedded line item within a PurchaseOrder. */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseOrderItem {
    private String productId;
    private String productName;
    private String sku;
    private int quantity;
    private double unitPrice;
    private double subtotal;
}
