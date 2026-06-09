package com.stockwise.suppliercustomer.repository;

import com.stockwise.suppliercustomer.model.Customer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Page<Customer> findByCustomerNameContainingIgnoreCase(String name, Pageable pageable);
}
