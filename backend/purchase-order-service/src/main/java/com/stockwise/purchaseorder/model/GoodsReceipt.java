package com.stockwise.purchaseorder.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** GoodsReceipt — records partial or full arrival of a purchase order. */
@Document(collection = "goods_receipts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GoodsReceipt {

    @Id
    private String id;

    private String poId;
    private String poNumber;

    private LocalDate receivedDate;
    private String receivedBy;
    private String remarks;

    private List<PurchaseOrderItem> receivedItems;
    private LocalDateTime createdAt;
}
