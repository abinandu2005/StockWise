package com.stockwise.salesdispatch.repository;

import com.stockwise.salesdispatch.model.ReturnOrder;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ReturnOrderRepository extends MongoRepository<ReturnOrder, String> {}
