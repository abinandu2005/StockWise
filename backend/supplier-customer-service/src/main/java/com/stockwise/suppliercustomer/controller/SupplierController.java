package com.stockwise.suppliercustomer.controller;

import com.stockwise.suppliercustomer.model.Supplier;
import com.stockwise.suppliercustomer.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers", description = "Supplier CRUD and search")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @PostMapping
    @Operation(summary = "Create a supplier")
    public ResponseEntity<Supplier> create(@RequestBody Supplier supplier) {
        supplier.setCreatedAt(LocalDateTime.now());
        supplier.setUpdatedAt(LocalDateTime.now());
        supplier.setActive(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(supplierRepository.save(supplier));
    }

    @GetMapping
    @Operation(summary = "Get all suppliers with optional search")
    public ResponseEntity<Page<Supplier>> getAll(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(supplierRepository.findBySupplierNameContainingIgnoreCase(search, pageable));
        }
        return ResponseEntity.ok(supplierRepository.findAll(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> getById(@PathVariable String id) {
        return supplierRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> update(@PathVariable String id, @RequestBody Supplier updates) {
        return supplierRepository.findById(id).map(s -> {
            updates.setId(id);
            updates.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(supplierRepository.save(updates));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        supplierRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
