package com.stockwise.salesdispatch.controller;

import com.stockwise.salesdispatch.model.*;
import com.stockwise.salesdispatch.service.SalesOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** Sales & Dispatch REST controller. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Sales & Dispatch", description = "Outbound sales orders, dispatch, returns")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @PostMapping("/api/sales-orders")
    @Operation(summary = "Create sales order and deduct inventory")
    public ResponseEntity<SalesOrder> create(
            @RequestBody SalesOrder request,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.createSalesOrder(request, userId));
    }

    @GetMapping("/api/sales-orders")
    @Operation(summary = "Get all sales orders")
    public ResponseEntity<Page<SalesOrder>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(salesOrderService.getAllOrders(pageable));
    }

    @GetMapping("/api/sales-orders/{id}")
    public ResponseEntity<SalesOrder> getById(@PathVariable String id) {
        return ResponseEntity.ok(salesOrderService.getById(id));
    }

    @PutMapping("/api/sales-orders/{id}")
    @Operation(summary = "Update a sales order (status, notes, tracking)")
    public ResponseEntity<SalesOrder> update(
            @PathVariable String id,
            @RequestBody SalesOrder updates,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.ok(salesOrderService.updateSalesOrder(id, updates, userId));
    }

    @DeleteMapping("/api/sales-orders/{id}")
    @Operation(summary = "Delete / cancel a sales order")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        salesOrderService.deleteSalesOrder(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/dispatch")
    @Operation(summary = "Create dispatch record for a confirmed sales order")
    public ResponseEntity<Dispatch> createDispatch(
            @RequestBody Dispatch dispatch,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.createDispatch(dispatch, userId));
    }

    @PostMapping("/api/returns")
    @Operation(summary = "Initiate a customer return order")
    public ResponseEntity<ReturnOrder> createReturn(
            @RequestBody ReturnOrder returnOrder,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(salesOrderService.processReturn(returnOrder, userId));
    }
}

