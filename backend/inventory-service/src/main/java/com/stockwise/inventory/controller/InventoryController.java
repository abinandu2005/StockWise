package com.stockwise.inventory.controller;

import com.stockwise.inventory.dto.ProductRequest;
import com.stockwise.inventory.dto.StockUpdateRequest;
import com.stockwise.inventory.model.Product;
import com.stockwise.inventory.model.StockLog;
import com.stockwise.inventory.service.InventoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Product & Inventory REST controller. */
@RestController
@RequiredArgsConstructor
@Tag(name = "Inventory", description = "Product CRUD, stock updates, barcode scanning")
public class InventoryController {

    private final InventoryService inventoryService;


    @PostMapping("/api/products")
    @Operation(summary = "Create a new product")
    public ResponseEntity<Product> createProduct(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.createProduct(request));
    }

    @GetMapping("/api/products")
    @Operation(summary = "Get all products with pagination and optional filters")
    public ResponseEntity<Page<Product>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(inventoryService.getAllProducts(category, search, pageable));
    }

    @GetMapping("/api/products/{id}")
    @Operation(summary = "Get product by ID")
    public ResponseEntity<Product> getProduct(@PathVariable String id) {
        return ResponseEntity.ok(inventoryService.getProductById(id));
    }

    @PutMapping("/api/products/{id}")
    @Operation(summary = "Update product")
    public ResponseEntity<Product> updateProduct(
            @PathVariable String id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(inventoryService.updateProduct(id, request));
    }

    @DeleteMapping("/api/products/{id}")
    @Operation(summary = "Delete product")
    public ResponseEntity<Map<String, String>> deleteProduct(@PathVariable String id) {
        inventoryService.deleteProduct(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }


    @PostMapping("/api/inventory/update-stock")
    @Operation(summary = "Update product stock (IN / OUT / ADJUSTMENT)")
    public ResponseEntity<Product> updateStock(
            @Valid @RequestBody StockUpdateRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "system") String userId) {
        return ResponseEntity.ok(inventoryService.updateStock(request, userId));
    }

    @PostMapping("/api/inventory/barcode-scan")
    @Operation(summary = "Look up a product by barcode")
    public ResponseEntity<Product> scanBarcode(@RequestParam String barcode) {
        return ResponseEntity.ok(inventoryService.findByBarcode(barcode));
    }

    @GetMapping("/api/inventory/logs/{productId}")
    @Operation(summary = "Get stock movement history for a product")
    public ResponseEntity<List<StockLog>> getStockLogs(@PathVariable String productId) {
        return ResponseEntity.ok(inventoryService.getStockLogs(productId));
    }

    @GetMapping("/api/inventory/logs")
    @Operation(summary = "Get all stock movement history logs")
    public ResponseEntity<List<StockLog>> getAllStockLogs() {
        return ResponseEntity.ok(inventoryService.getAllStockLogs());
    }
}
