package com.stockwise.salesdispatch.client;

import com.stockwise.salesdispatch.dto.StockUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

/** Feign client for deducting inventory on sales dispatch. */
@FeignClient(name = "inventory-service", url = "${inventory-service.url}", path = "/api/inventory")
public interface InventoryClient {
    @PostMapping("/update-stock")
    void updateStock(@RequestBody StockUpdateRequest request,
                     @RequestHeader("X-User-Id") String userId);
}
