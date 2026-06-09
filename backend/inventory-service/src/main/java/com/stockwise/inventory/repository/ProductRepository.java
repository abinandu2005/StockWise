package com.stockwise.inventory.repository;

import com.stockwise.inventory.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProductRepository extends MongoRepository<Product, String> {
    Optional<Product> findBySku(String sku);
    Optional<Product> findByBarcode(String barcode);
    Page<Product> findByCategory(String category, Pageable pageable);
    Page<Product> findByProductNameContainingIgnoreCase(String name, Pageable pageable);
    List<Product> findByStockQuantityLessThanEqual(int reorderLevel);

    @Query("{ 'stockQuantity': { $lte: '$reorderLevel' }, 'isActive': true }")
    List<Product> findLowStockProducts();
}
