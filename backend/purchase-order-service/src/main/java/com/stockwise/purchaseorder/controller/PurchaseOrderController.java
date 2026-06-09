package com.stockwise.purchaseorder.controller;

import com.stockwise.purchaseorder.model.GoodsReceipt;
import com.stockwise.purchaseorder.model.PurchaseOrder;
import com.stockwise.purchaseorder.service.PurchaseOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Purchase Order REST controller. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Purchase Orders", description = "PO management and goods receipt")
public class PurchaseOrderController {

    private final PurchaseOrderService poService;

    @PostMapping("/api/purchase-orders")
    @Operation(summary = "Create a new purchase order")
    public ResponseEntity<PurchaseOrder> create(
            @RequestBody PurchaseOrder request,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(poService.createPO(request, userId));
    }

    @GetMapping("/api/purchase-orders")
    @Operation(summary = "Get all purchase orders")
    public ResponseEntity<Page<PurchaseOrder>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(poService.getAllPOs(pageable));
    }

    @GetMapping("/api/purchase-orders/{id}")
    public ResponseEntity<PurchaseOrder> getById(@PathVariable String id) {
        return ResponseEntity.ok(poService.getPOById(id));
    }

    @PutMapping("/api/purchase-orders/{id}/status")
    @Operation(summary = "Update PO status (DRAFT/SENT/PARTIALLY_RECEIVED/COMPLETED)")
    public ResponseEntity<PurchaseOrder> updateStatus(
            @PathVariable String id, @RequestParam String status) {
        return ResponseEntity.ok(poService.updateStatus(id, status));
    }

    @DeleteMapping("/api/purchase-orders/{id}")
    @Operation(summary = "Delete a purchase order permanently")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        poService.deletePO(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/goods-receipt")
    @Operation(summary = "Record goods receipt and update inventory")
    public ResponseEntity<GoodsReceipt> receiveGoods(
            @RequestBody GoodsReceipt receipt,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(poService.processGoodsReceipt(receipt, userId));
    }
}
