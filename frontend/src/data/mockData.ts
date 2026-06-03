// ============================================================
// Mock Data — Realistic sample data for frontend development
// ============================================================

import type {
  Product, Supplier, PurchaseOrder, SalesOrder,
  Warehouse, Notification, ActivityLog, DashboardStats, ChartData,
} from "@/types";

export const mockDashboardStats: DashboardStats = {
  totalProducts: 2847,
  totalStockValue: 1285400,
  lowStockCount: 23,
  pendingOrders: 18,
  monthlyRevenue: 342800,
  monthlyGrowth: 12.5,
};

export const mockProducts: Product[] = [
  {
    id: "p1", sku: "SKU-001", name: "Wireless Bluetooth Headphones", description: "Premium noise-cancelling headphones",
    category: "Electronics", brand: "SoundMax", barcode: "8901234567890", unitPrice: 89.99, costPrice: 45.00,
    quantity: 342, minStockLevel: 50, warehouseStock: { "WH-01": 200, "WH-02": 142 },
    status: "in_stock", createdAt: "2024-01-15", updatedAt: "2024-06-20",
  },
  {
    id: "p2", sku: "SKU-002", name: "Ergonomic Office Chair", description: "Adjustable lumbar support office chair",
    category: "Furniture", brand: "ComfortPro", barcode: "8901234567891", unitPrice: 299.99, costPrice: 150.00,
    quantity: 15, minStockLevel: 20, warehouseStock: { "WH-01": 10, "WH-02": 5 },
    status: "low_stock", createdAt: "2024-02-10", updatedAt: "2024-06-18",
  },
  {
    id: "p3", sku: "SKU-003", name: "USB-C Hub Adapter 7-in-1", description: "Multi-port USB-C hub adapter",
    category: "Electronics", brand: "TechConnect", barcode: "8901234567892", unitPrice: 49.99, costPrice: 18.00,
    quantity: 580, minStockLevel: 100, warehouseStock: { "WH-01": 380, "WH-02": 200 },
    status: "in_stock", createdAt: "2024-01-20", updatedAt: "2024-06-22",
  },
  {
    id: "p4", sku: "SKU-004", name: "Standing Desk Converter", description: "Height-adjustable standing desk riser",
    category: "Furniture", brand: "ErgoRise", barcode: "8901234567893", unitPrice: 199.99, costPrice: 95.00,
    quantity: 0, minStockLevel: 10, warehouseStock: { "WH-01": 0, "WH-02": 0 },
    status: "out_of_stock", createdAt: "2024-03-01", updatedAt: "2024-06-19",
  },
  {
    id: "p5", sku: "SKU-005", name: "Mechanical Keyboard RGB", description: "Cherry MX Blue mechanical keyboard",
    category: "Electronics", brand: "KeyMaster", barcode: "8901234567894", unitPrice: 129.99, costPrice: 55.00,
    quantity: 167, minStockLevel: 30, warehouseStock: { "WH-01": 100, "WH-02": 67 },
    status: "in_stock", createdAt: "2024-01-25", updatedAt: "2024-06-21",
  },
  {
    id: "p6", sku: "SKU-006", name: "4K Webcam Pro", description: "4K Ultra HD webcam with autofocus",
    category: "Electronics", brand: "VisionTech", barcode: "8901234567895", unitPrice: 79.99, costPrice: 32.00,
    quantity: 8, minStockLevel: 25, warehouseStock: { "WH-01": 5, "WH-02": 3 },
    status: "low_stock", createdAt: "2024-02-15", updatedAt: "2024-06-17",
  },
  {
    id: "p7", sku: "SKU-007", name: "Wireless Mouse Pro", description: "Ergonomic wireless optical mouse",
    category: "Electronics", brand: "ClickPro", barcode: "8901234567896", unitPrice: 39.99, costPrice: 14.00,
    quantity: 423, minStockLevel: 60, warehouseStock: { "WH-01": 250, "WH-02": 173 },
    status: "in_stock", createdAt: "2024-01-10", updatedAt: "2024-06-23",
  },
  {
    id: "p8", sku: "SKU-008", name: "Monitor Arm Mount", description: "Single monitor desk arm mount",
    category: "Furniture", brand: "FlexArm", barcode: "8901234567897", unitPrice: 69.99, costPrice: 28.00,
    quantity: 92, minStockLevel: 20, warehouseStock: { "WH-01": 52, "WH-02": 40 },
    status: "in_stock", createdAt: "2024-02-20", updatedAt: "2024-06-20",
  },
];

export const mockSuppliers: Supplier[] = [
  {
    id: "s1", name: "TechWorld Distributors", email: "orders@techworld.com", phone: "+1 555-0101",
    address: "450 Tech Park, San Jose, CA 95134", contactPerson: "David Chen",
    rating: 4.8, totalOrders: 156, totalSpent: 284500, status: "active", pricingTier: "premium", createdAt: "2023-06-15",
  },
  {
    id: "s2", name: "Global Office Supplies", email: "sales@globaloffice.com", phone: "+1 555-0102",
    address: "120 Commerce Blvd, Austin, TX 78701", contactPerson: "Sarah Miller",
    rating: 4.5, totalOrders: 89, totalSpent: 167800, status: "active", pricingTier: "standard", createdAt: "2023-08-22",
  },
  {
    id: "s3", name: "Premium Electronics Co.", email: "wholesale@premiumelec.com", phone: "+1 555-0103",
    address: "780 Industrial Way, Seattle, WA 98101", contactPerson: "Michael Park",
    rating: 4.9, totalOrders: 234, totalSpent: 512000, status: "active", pricingTier: "enterprise", createdAt: "2023-03-10",
  },
  {
    id: "s4", name: "EcoFurn Materials", email: "info@ecofurn.com", phone: "+1 555-0104",
    address: "55 Green Lane, Portland, OR 97201", contactPerson: "Lisa Green",
    rating: 4.2, totalOrders: 45, totalSpent: 89200, status: "active", pricingTier: "standard", createdAt: "2023-11-05",
  },
  {
    id: "s5", name: "QuickShip Logistics", email: "partner@quickship.com", phone: "+1 555-0105",
    address: "900 Harbor Dr, Miami, FL 33101", contactPerson: "Carlos Rivera",
    rating: 3.8, totalOrders: 28, totalSpent: 42600, status: "inactive", pricingTier: "standard", createdAt: "2024-01-18",
  },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1", orderNumber: "PO-2024-001", supplierId: "s1", supplierName: "TechWorld Distributors",
    status: "completed",
    items: [
      { productId: "p1", productName: "Wireless Bluetooth Headphones", sku: "SKU-001", quantity: 100, unitPrice: 45, total: 4500 },
      { productId: "p3", productName: "USB-C Hub Adapter 7-in-1", sku: "SKU-003", quantity: 200, unitPrice: 18, total: 3600 },
    ],
    totalAmount: 8100, orderDate: "2024-05-15", expectedDelivery: "2024-05-25", receivedDate: "2024-05-23",
    notes: "Bulk order for Q2 restocking", createdBy: "Velan M",
  },
  {
    id: "po2", orderNumber: "PO-2024-002", supplierId: "s3", supplierName: "Premium Electronics Co.",
    status: "sent",
    items: [
      { productId: "p5", productName: "Mechanical Keyboard RGB", sku: "SKU-005", quantity: 50, unitPrice: 55, total: 2750 },
      { productId: "p6", productName: "4K Webcam Pro", sku: "SKU-006", quantity: 75, unitPrice: 32, total: 2400 },
    ],
    totalAmount: 5150, orderDate: "2024-06-10", expectedDelivery: "2024-06-25",
    notes: "Urgent replenishment for low stock items", createdBy: "Velan M",
  },
  {
    id: "po3", orderNumber: "PO-2024-003", supplierId: "s2", supplierName: "Global Office Supplies",
    status: "draft",
    items: [
      { productId: "p2", productName: "Ergonomic Office Chair", sku: "SKU-002", quantity: 30, unitPrice: 150, total: 4500 },
    ],
    totalAmount: 4500, orderDate: "2024-06-20", expectedDelivery: "2024-07-05",
    notes: "Office furniture restocking", createdBy: "Velan M",
  },
  {
    id: "po4", orderNumber: "PO-2024-004", supplierId: "s4", supplierName: "EcoFurn Materials",
    status: "partially_received",
    items: [
      { productId: "p4", productName: "Standing Desk Converter", sku: "SKU-004", quantity: 20, unitPrice: 95, total: 1900 },
      { productId: "p8", productName: "Monitor Arm Mount", sku: "SKU-008", quantity: 40, unitPrice: 28, total: 1120 },
    ],
    totalAmount: 3020, orderDate: "2024-06-05", expectedDelivery: "2024-06-20",
    notes: "Partial delivery expected - standing desks pending", createdBy: "Velan M",
  },
];

export const mockSalesOrders: SalesOrder[] = [
  {
    id: "so1", orderNumber: "SO-2024-001", customerName: "Acme Corporation", customerEmail: "procurement@acme.com",
    status: "delivered",
    items: [
      { productId: "p1", productName: "Wireless Bluetooth Headphones", sku: "SKU-001", quantity: 25, unitPrice: 89.99, total: 2249.75 },
      { productId: "p7", productName: "Wireless Mouse Pro", sku: "SKU-007", quantity: 25, unitPrice: 39.99, total: 999.75 },
    ],
    totalAmount: 3249.50, orderDate: "2024-06-01", shippedDate: "2024-06-03", deliveredDate: "2024-06-05",
    trackingNumber: "TRK-9876543210", notes: "Corporate bulk order",
  },
  {
    id: "so2", orderNumber: "SO-2024-002", customerName: "StartUp Hub Inc.", customerEmail: "office@startuphub.com",
    status: "shipped",
    items: [
      { productId: "p2", productName: "Ergonomic Office Chair", sku: "SKU-002", quantity: 10, unitPrice: 299.99, total: 2999.90 },
      { productId: "p5", productName: "Mechanical Keyboard RGB", sku: "SKU-005", quantity: 10, unitPrice: 129.99, total: 1299.90 },
    ],
    totalAmount: 4299.80, orderDate: "2024-06-15", shippedDate: "2024-06-17",
    trackingNumber: "TRK-1234567890", notes: "New office setup order",
  },
  {
    id: "so3", orderNumber: "SO-2024-003", customerName: "Remote Works Ltd.", customerEmail: "ops@remoteworks.io",
    status: "processing",
    items: [
      { productId: "p3", productName: "USB-C Hub Adapter 7-in-1", sku: "SKU-003", quantity: 50, unitPrice: 49.99, total: 2499.50 },
    ],
    totalAmount: 2499.50, orderDate: "2024-06-20", notes: "WFH equipment order",
  },
  {
    id: "so4", orderNumber: "SO-2024-004", customerName: "Design Studio Co.", customerEmail: "admin@designstudio.com",
    status: "pending",
    items: [
      { productId: "p8", productName: "Monitor Arm Mount", sku: "SKU-008", quantity: 15, unitPrice: 69.99, total: 1049.85 },
      { productId: "p6", productName: "4K Webcam Pro", sku: "SKU-006", quantity: 15, unitPrice: 79.99, total: 1199.85 },
    ],
    totalAmount: 2249.70, orderDate: "2024-06-22", notes: "Awaiting payment confirmation",
  },
];

export const mockWarehouses: Warehouse[] = [
  { id: "WH-01", name: "Main Warehouse", location: "Chennai, TN", capacity: 10000, currentStock: 6847, manager: "Abinandu R S", status: "active" },
  { id: "WH-02", name: "East Coast Hub", location: "Mumbai, MH", capacity: 8000, currentStock: 4230, manager: "Kamesh", status: "active" },
  { id: "WH-03", name: "Central Distribution", location: "Bengaluru, KA", capacity: 6000, currentStock: 0, manager: "Velan M", status: "inactive" },
];

export const mockNotifications: Notification[] = [
  { id: "n1", title: "Low Stock Alert", message: "Ergonomic Office Chair (SKU-002) is below minimum stock level", type: "warning", read: false, createdAt: "2024-06-22T14:30:00" },
  { id: "n2", title: "Order Received", message: "Purchase Order PO-2024-001 has been fully received", type: "success", read: false, createdAt: "2024-06-22T10:15:00" },
  { id: "n3", title: "New Supplier Added", message: "QuickShip Logistics has been added as a supplier", type: "info", read: true, createdAt: "2024-06-21T16:45:00" },
  { id: "n4", title: "Out of Stock", message: "Standing Desk Converter (SKU-004) is out of stock", type: "error", read: false, createdAt: "2024-06-21T09:00:00" },
  { id: "n5", title: "Delivery Delayed", message: "PO-2024-004 partial delivery delayed by 2 days", type: "warning", read: true, createdAt: "2024-06-20T11:30:00" },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: "a1", action: "Stock In", description: "Received 100 units of Wireless Bluetooth Headphones", user: "Abinandu R S", timestamp: "2024-06-22T15:30:00", type: "stock_in" },
  { id: "a2", action: "Order Created", description: "Purchase Order PO-2024-003 created", user: "Velan M", timestamp: "2024-06-22T14:00:00", type: "order" },
  { id: "a3", action: "Stock Out", description: "Shipped 25 units of Wireless Mouse Pro to Acme Corporation", user: "Abinandu R S", timestamp: "2024-06-22T11:15:00", type: "stock_out" },
  { id: "a4", action: "User Added", description: "New warehouse staff account created", user: "Abinandu R S", timestamp: "2024-06-22T09:00:00", type: "user" },
  { id: "a5", action: "Stock Updated", description: "Quantity adjusted for USB-C Hub Adapter 7-in-1", user: "Tareef", timestamp: "2024-06-21T16:30:00", type: "stock_in" },
  { id: "a6", action: "Order Shipped", description: "Sales Order SO-2024-002 shipped via FedEx", user: "Abinandu R S", timestamp: "2024-06-21T14:00:00", type: "order" },
  { id: "a7", action: "System Backup", description: "Automated system backup completed", user: "System", timestamp: "2024-06-21T02:00:00", type: "system" },
  { id: "a8", action: "Stock In", description: "Received 40 Monitor Arm Mounts from EcoFurn Materials", user: "Tareef", timestamp: "2024-06-20T10:00:00", type: "stock_in" },
];

export const mockInventoryChart: ChartData[] = [
  { name: "Jan", stockIn: 1200, stockOut: 890 },
  { name: "Feb", stockIn: 1400, stockOut: 1100 },
  { name: "Mar", stockIn: 1100, stockOut: 950 },
  { name: "Apr", stockIn: 1600, stockOut: 1300 },
  { name: "May", stockIn: 1350, stockOut: 1150 },
  { name: "Jun", stockIn: 1800, stockOut: 1400 },
];

export const mockCategoryChart: ChartData[] = [
  { name: "Electronics", value: 1520 },
  { name: "Furniture", value: 107 },
  { name: "Accessories", value: 423 },
  { name: "Peripherals", value: 797 },
];

export const mockRevenueChart: ChartData[] = [
  { name: "Jan", revenue: 245000 },
  { name: "Feb", revenue: 278000 },
  { name: "Mar", revenue: 265000 },
  { name: "Apr", revenue: 312000 },
  { name: "May", revenue: 298000 },
  { name: "Jun", revenue: 342800 },
];

export const CATEGORIES = [
  "Electronics", "Furniture", "Accessories", "Peripherals", "Office Supplies",
  "Networking", "Storage", "Audio", "Displays", "Cables",
];
