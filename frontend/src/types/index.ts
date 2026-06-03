// ============================================================
// StockWise Type Definitions
// ============================================================

export type UserRole = "admin" | "warehouse_staff" | "purchase_manager";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  companyName?: string;
  employeeId?: string;
  status?: "active" | "inactive" | "pending";
  lastLogin?: string;
  password?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  barcode: string;
  image?: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  minStockLevel: number;
  minStock?: number; // Support alias
  warehouseStock: Record<string, number>;
  status: "in_stock" | "low_stock" | "out_of_stock";
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  rating: number;
  totalOrders: number;
  totalSpent: number;
  status: "active" | "inactive";
  pricingTier: "standard" | "premium" | "enterprise";
  createdAt: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: "draft" | "sent" | "partially_received" | "completed" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  receivedDate?: string;
  deliveryDate?: string; // Support alias
  notes: string;
  createdBy: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "returned";
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  shippedDate?: string;
  deliveredDate?: string;
  trackingNumber?: string;
  notes: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
  currentStock: number;
  manager: string;
  status: "active" | "inactive";
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  user: string;
  timestamp: string;
  type: "stock_in" | "stock_out" | "order" | "system" | "user";
}

export interface DashboardStats {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  pendingOrders: number;
  monthlyRevenue: number;
  monthlyGrowth: number;
}

export interface ChartData {
  name: string;
  value?: number;
  [key: string]: string | number | undefined;
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}
