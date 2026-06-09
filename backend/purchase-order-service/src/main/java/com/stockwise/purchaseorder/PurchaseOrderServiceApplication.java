package com.stockwise.purchaseorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/** Purchase Order Management Service — POs, goods receipt, supplier emails. */
@SpringBootApplication
@EnableFeignClients
public class PurchaseOrderServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PurchaseOrderServiceApplication.class, args);
    }
}
