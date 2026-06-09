package com.stockwise.suppliercustomer.repository;

import com.stockwise.suppliercustomer.model.Supplier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SupplierRepository extends MongoRepository<Supplier, String> {
    Page<Supplier> findBySupplierNameContainingIgnoreCase(String name, Pageable pageable);
    Page<Supplier> findByPricingTier(String tier, Pageable pageable);
    boolean existsByEmail(String email);
}
