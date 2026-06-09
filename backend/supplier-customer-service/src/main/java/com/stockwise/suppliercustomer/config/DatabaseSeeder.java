package com.stockwise.suppliercustomer.config;

import com.stockwise.suppliercustomer.model.Supplier;
import com.stockwise.suppliercustomer.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final SupplierRepository supplierRepository;

    @Override
    public void run(String... args) {
        seedSuppliers();
    }

    private void seedSuppliers() {
        if (supplierRepository.count() == 0) {
            log.info("Seeding default suppliers into MongoDB...");

            Supplier s1 = Supplier.builder()
                    .id("s1")
                    .supplierName("TechWorld Distributors")
                    .email("orders@techworld.com")
                    .phone("+1 555-0101")
                    .address("450 Tech Park, San Jose, CA 95134")
                    .contactPerson("David Chen")
                    .rating(4.8)
                    .pricingTier("premium")
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Supplier s2 = Supplier.builder()
                    .id("s2")
                    .supplierName("Global Office Supplies")
                    .email("sales@globaloffice.com")
                    .phone("+1 555-0102")
                    .address("120 Commerce Blvd, Austin, TX 78701")
                    .contactPerson("Sarah Miller")
                    .rating(4.5)
                    .pricingTier("standard")
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Supplier s3 = Supplier.builder()
                    .id("s3")
                    .supplierName("Premium Electronics Co.")
                    .email("wholesale@premiumelec.com")
                    .phone("+1 555-0103")
                    .address("780 Industrial Way, Seattle, WA 98101")
                    .contactPerson("Michael Park")
                    .rating(4.9)
                    .pricingTier("enterprise")
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Supplier s4 = Supplier.builder()
                    .id("s4")
                    .supplierName("EcoFurn Materials")
                    .email("info@ecofurn.com")
                    .phone("+1 555-0104")
                    .address("55 Green Lane, Portland, OR 97201")
                    .contactPerson("Lisa Green")
                    .rating(4.2)
                    .pricingTier("standard")
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Supplier s5 = Supplier.builder()
                    .id("s5")
                    .supplierName("QuickShip Logistics")
                    .email("partner@quickship.com")
                    .phone("+1 555-0105")
                    .address("900 Harbor Dr, Miami, FL 33101")
                    .contactPerson("Carlos Rivera")
                    .rating(3.8)
                    .pricingTier("standard")
                    .isActive(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            supplierRepository.saveAll(List.of(s1, s2, s3, s4, s5));
            log.info("Suppliers seeded successfully.");
        }
    }
}
