package com.stockwise.inventory.controller;

import com.stockwise.inventory.model.Warehouse;
import com.stockwise.inventory.repository.WarehouseRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/** Warehouse management REST controller. */
@RestController
@RequestMapping("/api/warehouses")
@RequiredArgsConstructor
@Tag(name = "Warehouses", description = "Warehouse CRUD")
public class WarehouseController {

    private final WarehouseRepository warehouseRepository;

    @GetMapping
    @Operation(summary = "Get all warehouses")
    public ResponseEntity<List<Warehouse>> getAll() {
        return ResponseEntity.ok(warehouseRepository.findAll());
    }

    @PostMapping
    @Operation(summary = "Create a warehouse")
    public ResponseEntity<Warehouse> create(@RequestBody Warehouse warehouse) {
        warehouse.setCreatedAt(LocalDateTime.now());
        warehouse.setUpdatedAt(LocalDateTime.now());
        warehouse.setActive(true);
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseRepository.save(warehouse));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Warehouse> getById(@PathVariable String id) {
        return warehouseRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        warehouseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a warehouse")
    public ResponseEntity<Warehouse> update(@PathVariable String id, @RequestBody Warehouse updates) {
        return warehouseRepository.findById(id).map(w -> {
            w.setWarehouseName(updates.getWarehouseName());
            w.setAddress(updates.getAddress());
            w.setCity(updates.getCity());
            w.setState(updates.getState());
            w.setCountry(updates.getCountry());
            w.setManagerName(updates.getManagerName());
            w.setManagerEmail(updates.getManagerEmail());
            w.setCapacity(updates.getCapacity());
            w.setActive(updates.isActive());
            w.setUpdatedAt(LocalDateTime.now());
            return ResponseEntity.ok(warehouseRepository.save(w));
        }).orElse(ResponseEntity.notFound().build());
    }
}
