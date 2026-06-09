package com.stockwise.salesdispatch.repository;

import com.stockwise.salesdispatch.model.SalesOrder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SalesOrderRepository extends MongoRepository<SalesOrder, String> {
    Page<SalesOrder> findByStatus(SalesOrder.OrderStatus status, Pageable pageable);
    Page<SalesOrder> findByCustomerNameContainingIgnoreCase(String name, Pageable pageable);
}
