package com.stockwise.inventory.service;

import com.stockwise.inventory.dto.*;
import com.stockwise.inventory.model.Product;
import com.stockwise.inventory.model.StockLog;
import com.stockwise.inventory.model.Warehouse;
import com.stockwise.inventory.repository.ProductRepository;
import com.stockwise.inventory.repository.StockLogRepository;
import com.stockwise.inventory.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

/**
 * Core inventory service.
 * Handles product CRUD, stock adjustments, barcode scanning, and low-stock detection.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final ProductRepository productRepository;
    private final StockLogRepository stockLogRepository;
    private final WarehouseRepository warehouseRepository;

    // ─── Product CRUD ────────────────────────────────────────────────────────

    public Product createProduct(ProductRequest request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("SKU '" + request.getSku() + "' already exists");
        }
        Product product = Product.builder()
                .sku(request.getSku() != null ? request.getSku() : generateSku(request.getCategory()))
                .barcode(request.getBarcode())
                .productName(request.getProductName())
                .description(request.getDescription())
                .category(request.getCategory())
                .brand(request.getBrand())
                .price(request.getPrice())
                .costPrice(request.getCostPrice())
                .stockQuantity(request.getStockQuantity())
                .reorderLevel(request.getReorderLevel())
                .warehouseId(request.getWarehouseId())
                .warehouseStock(request.getWarehouseStock())
                .unit(request.getUnit())
                .expiryDate(request.getExpiryDate())
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return productRepository.save(product);
    }

    public Page<Product> getAllProducts(String category, String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return productRepository.findByProductNameContainingIgnoreCase(search, pageable);
        }
        if (category != null && !category.isBlank()) {
            return productRepository.findByCategory(category, pageable);
        }
        return productRepository.findAll(pageable);
    }

    public Product getProductById(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found: " + id));
    }

    public Product updateProduct(String id, ProductRequest request) {
        Product product = getProductById(id);
        if (request.getProductName() != null) product.setProductName(request.getProductName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getCategory() != null) product.setCategory(request.getCategory());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getPrice() > 0) product.setPrice(request.getPrice());
        if (request.getCostPrice() > 0) product.setCostPrice(request.getCostPrice());
        if (request.getStockQuantity() >= 0) product.setStockQuantity(request.getStockQuantity());
        if (request.getReorderLevel() > 0) product.setReorderLevel(request.getReorderLevel());
        if (request.getBarcode() != null) product.setBarcode(request.getBarcode());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getWarehouseId() != null) product.setWarehouseId(request.getWarehouseId());
        if (request.getWarehouseStock() != null) product.setWarehouseStock(request.getWarehouseStock());
        if (request.getUnit() != null) product.setUnit(request.getUnit());
        if (request.getExpiryDate() != null) product.setExpiryDate(request.getExpiryDate());
        product.setUpdatedAt(LocalDateTime.now());
        return productRepository.save(product);
    }

    public void deleteProduct(String id) {
        productRepository.deleteById(id);
        log.info("Product {} deleted", id);
    }

    // ─── Stock Operations ────────────────────────────────────────────────────

    /**
     * Update stock quantity (IN/OUT/ADJUSTMENT).
     * Thread-safe via optimistic locking approach — loads current, applies delta, saves.
     */
    public synchronized Product updateStock(StockUpdateRequest request, String updatedBy) {
        Product product = getProductById(request.getProductId());
        int prevQty = product.getStockQuantity();
        int newQty;

        switch (request.getActionType()) {
            case IN -> newQty = prevQty + request.getQuantity();
            case OUT -> {
                if (prevQty < request.getQuantity()) {
                    throw new RuntimeException("Insufficient stock. Available: " + prevQty);
                }
                newQty = prevQty - request.getQuantity();
            }
            default -> newQty = request.getQuantity(); // ADJUSTMENT sets absolute value
        }

        product.setStockQuantity(newQty);

        // Update warehouseStock map if warehouse is specified or fall back to primary warehouse
        String targetWarehouse = request.getWarehouse();
        if (targetWarehouse == null || targetWarehouse.isBlank()) {
            if (product.getWarehouseId() != null && !product.getWarehouseId().isBlank()) {
                targetWarehouse = warehouseRepository.findById(product.getWarehouseId())
                        .map(Warehouse::getWarehouseName)
                        .orElse(null);
            }
        }
        if (targetWarehouse == null || targetWarehouse.isBlank()) {
            targetWarehouse = warehouseRepository.findAll().stream()
                    .findFirst()
                    .map(Warehouse::getWarehouseName)
                    .orElse("Main Warehouse");
        }

        Map<String, Integer> whStock = product.getWarehouseStock();
        if (whStock == null) {
            whStock = new HashMap<>();
        }
        int whPrev = whStock.getOrDefault(targetWarehouse, 0);
        int whNew;
        switch (request.getActionType()) {
            case IN -> whNew = whPrev + request.getQuantity();
            case OUT -> whNew = Math.max(0, whPrev - request.getQuantity());
            default -> whNew = request.getQuantity();
        }
        whStock.put(targetWarehouse, whNew);
        product.setWarehouseStock(whStock);

        product.setUpdatedAt(LocalDateTime.now());
        productRepository.save(product);

        // Record audit log
        StockLog stockLog = StockLog.builder()
                .productId(product.getId())
                .productName(product.getProductName())
                .warehouseId(product.getWarehouseId())
                .actionType(request.getActionType())
                .quantity(request.getQuantity())
                .previousStock(prevQty)
                .updatedStock(newQty)
                .updatedBy(updatedBy)
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .timestamp(LocalDateTime.now())
                .build();
        stockLogRepository.save(stockLog);

        log.info("Stock updated for {} — {} {} units. New qty: {}", product.getSku(),
                request.getActionType(), request.getQuantity(), newQty);

        return product;
    }

    /** Look up product by barcode (for scanner input). */
    public Product findByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new RuntimeException("No product found for barcode: " + barcode));
    }

    public List<StockLog> getStockLogs(String productId) {
        return stockLogRepository.findByProductIdOrderByTimestampDesc(productId);
    }

    public List<StockLog> getAllStockLogs() {
        return stockLogRepository.findAllByOrderByTimestampDesc();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /** Auto-generate SKU from category prefix + random 6-char suffix. */
    private String generateSku(String category) {
        String prefix = (category != null && category.length() >= 3)
                ? category.substring(0, 3).toUpperCase()
                : "PRD";
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
