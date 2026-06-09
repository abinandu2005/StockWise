package com.stockwise.inventory.config;

import com.stockwise.inventory.model.Product;
import com.stockwise.inventory.model.Warehouse;
import com.stockwise.inventory.repository.ProductRepository;
import com.stockwise.inventory.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    @Override
    public void run(String... args) {
        seedWarehouses();
        seedProducts();
    }

    private void seedWarehouses() {
        if (warehouseRepository.count() == 0) {
            log.info("Seeding default warehouses into MongoDB...");
            
            Warehouse wh1 = Warehouse.builder()
                    .id("WH-01")
                    .warehouseName("Main Warehouse")
                    .address("450 Tech Road")
                    .city("Chennai")
                    .state("TN")
                    .country("India")
                    .managerName("Abinandu R S")
                    .managerEmail("abinandu2005@gmail.com")
                    .capacity(10000)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Warehouse wh2 = Warehouse.builder()
                    .id("WH-02")
                    .warehouseName("East Coast Hub")
                    .address("12 Ocean Drive")
                    .city("Mumbai")
                    .state("MH")
                    .country("India")
                    .managerName("Kamesh")
                    .managerEmail("kamesh@stockwise.com")
                    .capacity(8000)
                    .isActive(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            Warehouse wh3 = Warehouse.builder()
                    .id("WH-03")
                    .warehouseName("Central Distribution")
                    .address("88 Central Avenue")
                    .city("Bengaluru")
                    .state("KA")
                    .country("India")
                    .managerName("Velan M")
                    .managerEmail("velan@stockwise.com")
                    .capacity(6000)
                    .isActive(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            warehouseRepository.saveAll(List.of(wh1, wh2, wh3));
            log.info("Warehouses seeded successfully.");
        }
    }

    private void seedProducts() {
        if (productRepository.count() == 0) {
            log.info("Seeding default products into MongoDB...");

            Product p1 = createProductHelper("p1", "SKU-001", "8901234567890", "Wireless Bluetooth Headphones",
                    "Premium noise-cancelling headphones", "Electronics", 89.99, 45.00, 342, 50, "WH-01", 200, 142);

            Product p2 = createProductHelper("p2", "SKU-002", "8901234567891", "Ergonomic Office Chair",
                    "Adjustable lumbar support office chair", "Furniture", 299.99, 150.00, 15, 20, "WH-01", 10, 5);

            Product p3 = createProductHelper("p3", "SKU-003", "8901234567892", "USB-C Hub Adapter 7-in-1",
                    "Multi-port USB-C hub adapter", "Electronics", 49.99, 18.00, 580, 100, "WH-01", 380, 200);

            Product p4 = createProductHelper("p4", "SKU-004", "8901234567893", "Standing Desk Converter",
                    "Height-adjustable standing desk riser", "Furniture", 199.99, 95.00, 0, 10, "WH-01", 0, 0);

            Product p5 = createProductHelper("p5", "SKU-005", "8901234567894", "Mechanical Keyboard RGB",
                    "Cherry MX Blue mechanical keyboard", "Electronics", 129.99, 55.00, 167, 30, "WH-01", 100, 67);

            Product p6 = createProductHelper("p6", "SKU-006", "8901234567895", "4K Webcam Pro",
                    "4K Ultra HD webcam with autofocus", "Electronics", 79.99, 32.00, 8, 25, "WH-01", 5, 3);

            Product p7 = createProductHelper("p7", "SKU-007", "8901234567896", "Wireless Mouse Pro",
                    "Ergonomic wireless optical mouse", "Electronics", 39.99, 14.00, 423, 60, "WH-01", 250, 173);

            Product p8 = createProductHelper("p8", "SKU-008", "8901234567897", "Monitor Arm Mount",
                    "Single monitor desk arm mount", "Furniture", 69.99, 28.00, 92, 20, "WH-01", 52, 40);

            productRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6, p7, p8));
            log.info("Products seeded successfully.");
        }
    }

    private Product createProductHelper(String id, String sku, String barcode, String name, String desc,
                                       String category, double price, double cost, int qty, int reorder,
                                       String mainWhId, int wh01Qty, int wh02Qty) {
        Map<String, Integer> whStock = new HashMap<>();
        whStock.put("WH-01", wh01Qty);
        whStock.put("WH-02", wh02Qty);

        return Product.builder()
                .id(id)
                .sku(sku)
                .barcode(barcode)
                .productName(name)
                .description(desc)
                .category(category)
                .price(price)
                .costPrice(cost)
                .stockQuantity(qty)
                .reorderLevel(reorder)
                .warehouseStock(whStock)
                .warehouseId(mainWhId)
                .unit("pcs")
                .isActive(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
