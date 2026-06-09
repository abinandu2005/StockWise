package com.stockwise.purchaseorder.service;

import com.stockwise.purchaseorder.client.InventoryClient;
import com.stockwise.purchaseorder.dto.StockUpdateRequest;
import com.stockwise.purchaseorder.model.GoodsReceipt;
import com.stockwise.purchaseorder.model.PurchaseOrder;
import com.stockwise.purchaseorder.model.PurchaseOrderItem;
import com.stockwise.purchaseorder.repository.GoodsReceiptRepository;
import com.stockwise.purchaseorder.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Purchase Order service.
 * Creates POs, manages status transitions, and updates inventory on goods receipt.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository poRepository;
    private final GoodsReceiptRepository goodsReceiptRepository;
    private final InventoryClient inventoryClient;

    public PurchaseOrder createPO(PurchaseOrder request, String createdBy) {
        request.setPoNumber(generatePoNumber());
        request.setStatus(PurchaseOrder.POStatus.DRAFT);
        request.setCreatedBy(createdBy);
        request.setCreatedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        // Calculate total
        if (request.getItems() != null) {
            double total = request.getItems().stream()
                    .mapToDouble(item -> {
                        item.setSubtotal(item.getQuantity() * item.getUnitPrice());
                        return item.getSubtotal();
                    }).sum();
            request.setTotalAmount(total);
        }

        return poRepository.save(request);
    }

    public Page<PurchaseOrder> getAllPOs(Pageable pageable) {
        return poRepository.findAll(pageable);
    }

    public PurchaseOrder getPOById(String id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found: " + id));
    }

    public PurchaseOrder updateStatus(String id, String status) {
        PurchaseOrder po = getPOById(id);
        po.setStatus(PurchaseOrder.POStatus.valueOf(status));
        po.setUpdatedAt(LocalDateTime.now());
        return poRepository.save(po);
    }

    public void deletePO(String id) {
        PurchaseOrder po = getPOById(id);
        poRepository.delete(po);
        log.info("Purchase Order {} permanently deleted", id);
    }

    /**
     * Record goods receipt and update inventory via OpenFeign.
     * Sets PO status to PARTIALLY_RECEIVED or COMPLETED.
     */
    public GoodsReceipt processGoodsReceipt(GoodsReceipt receipt, String userId) {
        PurchaseOrder po = getPOById(receipt.getPoId());
        receipt.setPoNumber(po.getPoNumber());
        receipt.setCreatedAt(LocalDateTime.now());

        // Update inventory for each received item
        if (receipt.getReceivedItems() != null) {
            receipt.getReceivedItems().forEach(item -> {
                StockUpdateRequest stockReq = new StockUpdateRequest();
                stockReq.setProductId(item.getProductId());
                stockReq.setActionType("IN");
                stockReq.setQuantity(item.getQuantity());
                stockReq.setReferenceId(po.getPoNumber());
                stockReq.setNotes("Goods received from PO: " + po.getPoNumber());
                try {
                    inventoryClient.updateStock(stockReq, userId);
                } catch (Exception e) {
                    log.error("Failed to update inventory for product {}: {}", item.getProductId(), e.getMessage());
                }
            });
        }

        // Save the goods receipt first
        GoodsReceipt savedReceipt = goodsReceiptRepository.save(receipt);

        // Calculate PO status based on total received quantities vs ordered quantities
        List<GoodsReceipt> allReceipts = goodsReceiptRepository.findByPoId(po.getId());
        boolean allCompleted = true;
        if (po.getItems() != null) {
            for (PurchaseOrderItem poItem : po.getItems()) {
                int totalReceived = allReceipts.stream()
                        .filter(r -> r.getReceivedItems() != null)
                        .flatMap(r -> r.getReceivedItems().stream())
                        .filter(ri -> ri.getProductId() != null && ri.getProductId().equals(poItem.getProductId()))
                        .mapToInt(PurchaseOrderItem::getQuantity)
                        .sum();
                if (totalReceived < poItem.getQuantity()) {
                    allCompleted = false;
                    break;
                }
            }
        } else {
            allCompleted = false;
        }

        if (allCompleted) {
            po.setStatus(PurchaseOrder.POStatus.COMPLETED);
        } else {
            po.setStatus(PurchaseOrder.POStatus.PARTIALLY_RECEIVED);
        }
        po.setUpdatedAt(LocalDateTime.now());
        poRepository.save(po);

        log.info("Goods receipt processed for PO {} (status: {})", po.getPoNumber(), po.getStatus());
        return savedReceipt;
    }

    private String generatePoNumber() {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long count = poRepository.count() + 1;
        return String.format("PO-%s-%04d", date, count);
    }
}
