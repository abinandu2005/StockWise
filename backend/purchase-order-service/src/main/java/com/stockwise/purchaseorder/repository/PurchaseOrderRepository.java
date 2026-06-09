package com.stockwise.purchaseorder.repository;

import com.stockwise.purchaseorder.model.PurchaseOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PurchaseOrderRepository extends MongoRepository<PurchaseOrder, String> {
    Optional<PurchaseOrder> findByPoNumber(String poNumber);
    Page<PurchaseOrder> findByStatus(PurchaseOrder.POStatus status, Pageable pageable);
    List<PurchaseOrder> findBySupplierId(String supplierId);
    long countByStatus(PurchaseOrder.POStatus status);
}
