import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import {
  mockProducts,
  mockSuppliers,
  mockPurchaseOrders,
  mockSalesOrders,
  mockWarehouses,
  mockNotifications,
  mockActivityLogs,
} from "@/data/mockData";
import type {
  Product,
  Supplier,
  PurchaseOrder,
  SalesOrder,
  Warehouse,
  Notification,
  ActivityLog,
  DashboardStats,
} from "@/types";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

interface DataContextType {
  products: Product[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  warehouses: Warehouse[];
  notifications: Notification[];
  activityLogs: ActivityLog[];
  stats: DashboardStats;

  // Products
  addProduct: (product: Omit<Product, "id" | "createdAt" | "updatedAt" | "status">) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  adjustProductStock: (id: string, quantityChange: number, action: "in" | "out") => void;

  // Suppliers
  addSupplier: (supplier: Omit<Supplier, "id" | "createdAt" | "totalOrders" | "totalSpent">) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  // Purchase Orders
  addPurchaseOrder: (po: Omit<PurchaseOrder, "id" | "orderDate" | "orderNumber" | "totalAmount" | "status" | "createdBy">) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  sendPurchaseOrder: (id: string) => void;
  receivePurchaseOrder: (id: string) => void;

  // Sales Orders
  addSalesOrder: (so: Omit<SalesOrder, "id" | "orderDate" | "orderNumber" | "status">) => void;
  updateSalesOrder: (id: string, updates: Partial<SalesOrder>) => void;
  deleteSalesOrder: (id: string) => void;
  markSalesOrderShipped: (id: string, trackingNumber: string) => void;

  // Warehouses
  addWarehouse: (warehouse: Omit<Warehouse, "id" | "currentStock">) => void;
  updateWarehouse: (id: string, updates: Partial<Warehouse>) => void;
  deleteWarehouse: (id: string) => void;

  // Notifications
  addNotification: (title: string, message: string, type: Notification["type"]) => void;
  markNotificationsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const getLocalOrFallback = <T,>(key: string, fallback: T): T => {
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userName = user?.name || "System";

  // State initialization
  const [products, setProducts] = useState<Product[]>(() =>
    getLocalOrFallback("stockwise-products", mockProducts)
  );
  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getLocalOrFallback("stockwise-suppliers", mockSuppliers)
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() =>
    getLocalOrFallback("stockwise-purchase-orders", mockPurchaseOrders)
  );
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() =>
    getLocalOrFallback("stockwise-sales-orders", mockSalesOrders)
  );
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() =>
    getLocalOrFallback("stockwise-warehouses", mockWarehouses)
  );
  const [notifications, setNotifications] = useState<Notification[]>(() =>
    getLocalOrFallback("stockwise-notifications", mockNotifications)
  );
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() =>
    getLocalOrFallback("stockwise-activity-logs", mockActivityLogs)
  );

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("stockwise-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("stockwise-suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem("stockwise-purchase-orders", JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem("stockwise-sales-orders", JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem("stockwise-warehouses", JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem("stockwise-notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem("stockwise-activity-logs", JSON.stringify(activityLogs));
  }, [activityLogs]);

  // Helper: Get product status
  const getProductStatus = (qty: number, minLvl: number): Product["status"] => {
    if (qty <= 0) return "out_of_stock";
    if (qty <= minLvl) return "low_stock";
    return "in_stock";
  };

  // Helper: Add activity log
  const logActivity = (action: string, description: string, type: ActivityLog["type"]) => {
    const newLog: ActivityLog = {
      id: Math.random().toString(36).slice(2),
      action,
      description,
      user: userName,
      timestamp: new Date().toISOString(),
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  };

  // Helper: Add notification
  const addNotification = (title: string, message: string, type: Notification["type"]) => {
    const newNotif: Notification = {
      id: Math.random().toString(36).slice(2),
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // --------------------------------------------------------
  // PRODUCTS METHODS
  // --------------------------------------------------------
  const addProduct = (p: Omit<Product, "id" | "createdAt" | "updatedAt" | "status">) => {
    const id = Math.random().toString(36).slice(2);
    const minLvl = p.minStockLevel || p.minStock || 0;
    const status = getProductStatus(p.quantity, minLvl);
    const newProduct: Product = {
      ...p,
      id,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [newProduct, ...prev]);
    logActivity("Add Product", `Product "${p.name}" (${p.sku}) added to inventory.`, "stock_in");
    addNotification("Product Created", `Product ${p.name} was added by ${userName}.`, "success");
    toast.success(`Product "${p.name}" added successfully.`);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...updates, updatedAt: new Date().toISOString() };
        const minLvl = merged.minStockLevel || merged.minStock || 0;
        merged.status = getProductStatus(merged.quantity, minLvl);
        return merged;
      })
    );
    const pName = products.find((p) => p.id === id)?.name || "Unknown Product";
    logActivity("Update Product", `Product "${pName}" details updated.`, "system");
    toast.success(`Product "${pName}" updated successfully.`);
  };

  const deleteProduct = (id: string) => {
    const pName = products.find((p) => p.id === id)?.name || "Unknown Product";
    setProducts((prev) => prev.filter((p) => p.id !== id));
    logActivity("Delete Product", `Product "${pName}" removed from system.`, "system");
    addNotification("Product Deleted", `Product "${pName}" was deleted by ${userName}.`, "warning");
    toast.success(`Product "${pName}" deleted successfully.`);
  };

  const adjustProductStock = (id: string, quantityChange: number, action: "in" | "out") => {
    let pName = "";
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        pName = p.name;
        const newQty = action === "in" ? p.quantity + quantityChange : Math.max(0, p.quantity - quantityChange);
        const minLvl = p.minStockLevel || p.minStock || 0;
        const newStatus = getProductStatus(newQty, minLvl);
        
        if (newQty <= minLvl && p.quantity > minLvl) {
          addNotification(
            "Low Stock Alert",
            `Stock level for "${p.name}" has fallen to ${newQty} units.`,
            "warning"
          );
        }
        return {
          ...p,
          quantity: newQty,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    logActivity(
      action === "in" ? "Stock Scan In" : "Stock Scan Out",
      `${action === "in" ? "Added" : "Removed"} ${quantityChange} units of "${pName}".`,
      action === "in" ? "stock_in" : "stock_out"
    );
    toast.success(`Adjusted stock of "${pName}" by ${action === "in" ? "+" : "-"}${quantityChange} units.`);
  };

  // --------------------------------------------------------
  // SUPPLIERS METHODS
  // --------------------------------------------------------
  const addSupplier = (s: Omit<Supplier, "id" | "createdAt" | "totalOrders" | "totalSpent">) => {
    const newSupplier: Supplier = {
      ...s,
      id: Math.random().toString(36).slice(2),
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
    };
    setSuppliers((prev) => [newSupplier, ...prev]);
    logActivity("Add Supplier", `Supplier "${s.name}" added to network.`, "system");
    toast.success(`Supplier "${s.name}" added successfully.`);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    const sName = suppliers.find((s) => s.id === id)?.name || "Unknown Supplier";
    logActivity("Update Supplier", `Supplier "${sName}" details updated.`, "system");
    toast.success(`Supplier "${sName}" updated successfully.`);
  };

  const deleteSupplier = (id: string) => {
    const sName = suppliers.find((s) => s.id === id)?.name || "Unknown Supplier";
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    logActivity("Remove Supplier", `Supplier "${sName}" removed from system.`, "system");
    toast.success(`Supplier "${sName}" removed successfully.`);
  };

  // --------------------------------------------------------
  // PURCHASE ORDERS METHODS
  // --------------------------------------------------------
  const addPurchaseOrder = (po: Omit<PurchaseOrder, "id" | "orderDate" | "orderNumber" | "totalAmount" | "status" | "createdBy">) => {
    const orderNumber = `PO-${1000 + purchaseOrders.length + 1}`;
    
    // Calculate total amount from items
    const totalAmount = po.items.reduce((sum, item) => sum + item.total, 0);

    const newPO: PurchaseOrder = {
      ...po,
      id: Math.random().toString(36).slice(2),
      orderNumber,
      totalAmount,
      status: "draft",
      orderDate: new Date().toISOString(),
      createdBy: userName,
    };

    setPurchaseOrders((prev) => [newPO, ...prev]);
    logActivity("Create PO", `Purchase Order "${orderNumber}" created in draft status.`, "order");
    toast.success(`Purchase Order "${orderNumber}" created successfully as Draft.`);
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
    toast.success("Purchase Order details updated.");
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Purchase Order cancelled.");
  };

  const sendPurchaseOrder = (id: string) => {
    let orderNum = "";
    let supplierName = "";
    setPurchaseOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        orderNum = o.orderNumber;
        supplierName = o.supplierName;
        return { ...o, status: "sent" };
      })
    );
    logActivity("Send PO", `Sent Purchase Order "${orderNum}" to supplier "${supplierName}".`, "order");
    toast.success(`Purchase Order "${orderNum}" sent to supplier.`);
  };

  const receivePurchaseOrder = (id: string) => {
    let poToComplete: PurchaseOrder | undefined;

    setPurchaseOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        poToComplete = o;
        return { ...o, status: "completed", receivedDate: new Date().toISOString() };
      })
    );

    if (poToComplete) {
      const po = poToComplete as PurchaseOrder;
      // Increment supplier total orders and spending
      setSuppliers((prevS) =>
        prevS.map((s) => {
          if (s.id !== po.supplierId) return s;
          return {
            ...s,
            totalOrders: s.totalOrders + 1,
            totalSpent: s.totalSpent + po.totalAmount,
          };
        })
      );

      // Increment inventory counts
      setProducts((prevP) =>
        prevP.map((p) => {
          const matchingItem = po.items.find((item) => item.productId === p.id);
          if (!matchingItem) return p;
          const newQty = p.quantity + matchingItem.quantity;
          const minLvl = p.minStockLevel || p.minStock || 0;
          return {
            ...p,
            quantity: newQty,
            status: getProductStatus(newQty, minLvl),
            updatedAt: new Date().toISOString(),
          };
        })
      );

      logActivity(
        "Receive PO",
        `Received all items for PO "${po.orderNumber}". Stock quantities updated.`,
        "stock_in"
      );
      addNotification(
        "PO Received",
        `Purchase Order "${po.orderNumber}" received and added to inventory.`,
        "success"
      );
      toast.success(`Received and completed Purchase Order "${po.orderNumber}".`);
    }
  };

  // --------------------------------------------------------
  // SALES ORDERS METHODS
  // --------------------------------------------------------
  const addSalesOrder = (so: Omit<SalesOrder, "id" | "orderDate" | "orderNumber" | "status">) => {
    // Check stock availability
    for (const item of so.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod || prod.quantity < item.quantity) {
        toast.error(`Insufficient stock for product "${item.productName}". Available: ${prod?.quantity || 0}`);
        return;
      }
    }

    const orderNumber = `SO-${2000 + salesOrders.length + 1}`;
    const totalAmount = so.items.reduce((sum, item) => sum + item.total, 0);

    const newSO: SalesOrder = {
      ...so,
      id: Math.random().toString(36).slice(2),
      orderNumber,
      totalAmount,
      status: "pending",
      orderDate: new Date().toISOString(),
    };

    // Deduct stock levels
    setProducts((prevP) =>
      prevP.map((p) => {
        const item = so.items.find((it) => it.productId === p.id);
        if (!item) return p;
        const newQty = Math.max(0, p.quantity - item.quantity);
        const minLvl = p.minStockLevel || p.minStock || 0;
        
        if (newQty <= minLvl) {
          addNotification(
            "Low Stock Alert",
            `Stock level for "${p.name}" has fallen to ${newQty} units.`,
            "warning"
          );
        }
        return {
          ...p,
          quantity: newQty,
          status: getProductStatus(newQty, minLvl),
          updatedAt: new Date().toISOString(),
        };
      })
    );

    setSalesOrders((prev) => [newSO, ...prev]);
    logActivity("Create Sale", `Sales Order "${orderNumber}" registered. Stock dispatched.`, "stock_out");
    toast.success(`Sales Order "${orderNumber}" created successfully.`);
  };

  const updateSalesOrder = (id: string, updates: Partial<SalesOrder>) => {
    setSalesOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
    toast.success("Sales Order details updated.");
  };

  const deleteSalesOrder = (id: string) => {
    setSalesOrders((prev) => prev.filter((o) => o.id !== id));
    toast.success("Sales Order deleted.");
  };

  const markSalesOrderShipped = (id: string, trackingNumber: string) => {
    let orderNum = "";
    setSalesOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        orderNum = o.orderNumber;
        return {
          ...o,
          status: "shipped",
          trackingNumber,
          shippedDate: new Date().toISOString(),
        };
      })
    );
    logActivity("Ship Order", `Order "${orderNum}" marked as shipped. Tracking ID: ${trackingNumber}`, "order");
    toast.success(`Order "${orderNum}" shipped successfully.`);
  };

  // --------------------------------------------------------
  // WAREHOUSES METHODS
  // --------------------------------------------------------
  const addWarehouse = (w: Omit<Warehouse, "id" | "currentStock">) => {
    const newWH: Warehouse = {
      ...w,
      id: Math.random().toString(36).slice(2),
      currentStock: 0,
    };
    setWarehouses((prev) => [newWH, ...prev]);
    logActivity("Add Warehouse", `Warehouse "${w.name}" in ${w.location} registered.`, "system");
    toast.success(`Warehouse "${w.name}" added successfully.`);
  };

  const updateWarehouse = (id: string, updates: Partial<Warehouse>) => {
    setWarehouses((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
    toast.success("Warehouse updated.");
  };

  const deleteWarehouse = (id: string) => {
    setWarehouses((prev) => prev.filter((w) => w.id !== id));
    toast.success("Warehouse deleted.");
  };

  // --------------------------------------------------------
  // NOTIFICATIONS METHODS
  // --------------------------------------------------------
  const markNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read.");
  };

  // --------------------------------------------------------
  // COMPUTED DASHBOARD STATISTICS
  // --------------------------------------------------------
  const stats = useMemo<DashboardStats>(() => {
    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    const lowStockCount = products.filter((p) => p.quantity <= (p.minStockLevel || p.minStock || 0)).length;
    const pendingOrders = purchaseOrders.filter(
      (o) => o.status === "sent" || o.status === "partially_received"
    ).length;

    // Monthly growth simulated at 8.2%
    return {
      totalProducts,
      totalStockValue,
      lowStockCount,
      pendingOrders,
      monthlyRevenue: salesOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      monthlyGrowth: 8.2,
    };
  }, [products, purchaseOrders, salesOrders]);

  return (
    <DataContext.Provider
      value={{
        products,
        suppliers,
        purchaseOrders,
        salesOrders,
        warehouses,
        notifications,
        activityLogs,
        stats,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        addPurchaseOrder,
        updatePurchaseOrder,
        deletePurchaseOrder,
        sendPurchaseOrder,
        receivePurchaseOrder,
        addSalesOrder,
        updateSalesOrder,
        deleteSalesOrder,
        markSalesOrderShipped,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        addNotification,
        markNotificationsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
}
