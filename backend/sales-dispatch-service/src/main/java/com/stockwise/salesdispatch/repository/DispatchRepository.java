package com.stockwise.salesdispatch.repository;

import com.stockwise.salesdispatch.model.Dispatch;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface DispatchRepository extends MongoRepository<Dispatch, String> {
    List<Dispatch> findBySalesOrderId(String salesOrderId);
}
