package com.stockwise.salesdispatch.service;

import com.stockwise.salesdispatch.client.InventoryClient;
import com.stockwise.salesdispatch.dto.StockUpdateRequest;
import com.stockwise.salesdispatch.model.*;
import com.stockwise.salesdispatch.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * Sales & Dispatch service.
 * Creates sales orders, deducts inventory via Feign, manages dispatch and returns.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalesOrderService {

    private final SalesOrderRepository salesOrderRepository;
    private final DispatchRepository dispatchRepository;
    private final ReturnOrderRepository returnOrderRepository;
    private final InventoryClient inventoryClient;

    public SalesOrder createSalesOrder(SalesOrder request, String userId) {
        // Preserve orderNumber if frontend supplied one, otherwise generate
        if (request.getOrderNumber() == null || request.getOrderNumber().isBlank()) {
            request.setOrderNumber(generateOrderNumber());
        }
        if (request.getStatus() == null) {
            request.setStatus(SalesOrder.OrderStatus.PENDING);
        }
        request.setCreatedBy(userId);
        if (request.getOrderDate() == null) {
            request.setOrderDate(LocalDateTime.now());
        }
        if (request.getTrackingNumber() == null || request.getTrackingNumber().isBlank()) {
            request.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }

        // Calculate total
        if (request.getItems() != null) {
            double total = request.getItems().stream()
                    .mapToDouble(item -> {
                        item.setSubtotal(item.getQuantity() * item.getUnitPrice());
                        return item.getSubtotal();
                    }).sum();
            // Only override totalAmount if not already set by frontend
            if (request.getTotalAmount() == 0) {
                request.setTotalAmount(total);
            }
        }

        // Attempt inventory deduction — non-blocking: log error but still save the order
        if (request.getItems() != null) {
            request.getItems().forEach(item -> {
                try {
                    StockUpdateRequest stockReq = new StockUpdateRequest();
                    stockReq.setProductId(item.getProductId());
                    stockReq.setActionType("OUT");
                    stockReq.setQuantity(item.getQuantity());
                    stockReq.setReferenceId(request.getOrderNumber());
                    stockReq.setNotes("Sales order: " + request.getOrderNumber());
                    inventoryClient.updateStock(stockReq, userId);
                } catch (Exception e) {
                    log.warn("Inventory deduction skipped for {}: {}", item.getProductId(), e.getMessage());
                }
            });
        }

        SalesOrder saved = salesOrderRepository.save(request);
        log.info("Sales order created: {}", saved.getOrderNumber());
        return saved;
    }

    public Page<SalesOrder> getAllOrders(Pageable pageable) {
        return salesOrderRepository.findAll(pageable);
    }

    public SalesOrder getById(String id) {
        return salesOrderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sales order not found: " + id));
    }

    public SalesOrder updateSalesOrder(String id, SalesOrder updates, String userId) {
        SalesOrder existing = getById(id);

        // Update only non-null fields
        if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
        if (updates.getTrackingNumber() != null) existing.setTrackingNumber(updates.getTrackingNumber());
        if (updates.getNotes() != null) existing.setNotes(updates.getNotes());
        if (updates.getShippedDate() != null) existing.setShippedDate(updates.getShippedDate());
        if (updates.getDeliveredDate() != null) existing.setDeliveredDate(updates.getDeliveredDate());

        SalesOrder saved = salesOrderRepository.save(existing);
        log.info("Sales order {} updated by {}", id, userId);
        return saved;
    }

    public void deleteSalesOrder(String id) {
        SalesOrder existing = getById(id);
        // Mark as cancelled instead of hard delete to preserve audit trail
        existing.setStatus(SalesOrder.OrderStatus.CANCELLED);
        salesOrderRepository.save(existing);
        log.info("Sales order {} cancelled", id);
    }

    public Dispatch createDispatch(Dispatch dispatch, String userId) {
        SalesOrder order = getById(dispatch.getSalesOrderId());
        dispatch.setOrderNumber(order.getOrderNumber());
        dispatch.setTrackingNumber("TRK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dispatch.setDispatchedBy(userId);
        dispatch.setCreatedAt(LocalDateTime.now());
        dispatch.setStatus("DISPATCHED");

        order.setStatus(SalesOrder.OrderStatus.SHIPPED);
        order.setShippedDate(LocalDateTime.now());
        salesOrderRepository.save(order);

        return dispatchRepository.save(dispatch);
    }

    public ReturnOrder processReturn(ReturnOrder returnOrder, String userId) {
        returnOrder.setReturnStatus("REQUESTED");
        returnOrder.setProcessedBy(userId);
        returnOrder.setCreatedAt(LocalDateTime.now());
        returnOrder.setUpdatedAt(LocalDateTime.now());
        return returnOrderRepository.save(returnOrder);
    }

    private String generateOrderNumber() {
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = salesOrderRepository.count() + 1;
        return String.format("SO-%s-%04d", date, count);
    }
}

