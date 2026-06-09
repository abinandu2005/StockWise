package com.stockwise.inventory.repository;

import com.stockwise.inventory.model.Warehouse;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface WarehouseRepository extends MongoRepository<Warehouse, String> {
    boolean existsByWarehouseName(String name);
}
