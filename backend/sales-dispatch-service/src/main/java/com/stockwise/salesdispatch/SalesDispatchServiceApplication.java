package com.stockwise.salesdispatch;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

/** Sales & Dispatch Service — outbound orders, dispatch, returns. */
@SpringBootApplication
@EnableFeignClients
public class SalesDispatchServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(SalesDispatchServiceApplication.class, args);
    }
}
