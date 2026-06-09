package com.stockwise.analytics;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Analytics, Reports & Notification Service — dashboards, audit logs, PDF reports, email alerts. */
@SpringBootApplication
@EnableFeignClients
@EnableScheduling
public class AnalyticsReportsServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AnalyticsReportsServiceApplication.class, args);
    }
}
