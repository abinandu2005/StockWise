package com.stockwise.inventory.repository;

import com.stockwise.inventory.model.StockLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockLogRepository extends MongoRepository<StockLog, String> {
    List<StockLog> findByProductIdOrderByTimestampDesc(String productId);
    List<StockLog> findByWarehouseIdOrderByTimestampDesc(String warehouseId);
    List<StockLog> findByUpdatedByOrderByTimestampDesc(String updatedBy);
    List<StockLog> findAllByOrderByTimestampDesc();
}
