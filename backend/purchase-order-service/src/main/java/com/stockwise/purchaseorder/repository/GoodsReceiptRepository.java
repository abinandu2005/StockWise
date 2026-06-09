package com.stockwise.purchaseorder.repository;

import com.stockwise.purchaseorder.model.GoodsReceipt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoodsReceiptRepository extends MongoRepository<GoodsReceipt, String> {
    List<GoodsReceipt> findByPoId(String poId);
}
