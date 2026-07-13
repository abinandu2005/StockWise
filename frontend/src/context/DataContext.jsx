import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { get, post, put, del } from "@/lib/api";

// ── Data Mapping Helpers ─────────────────────────────────────
const mapProductFromBackend = (p) => ({
  id: p.id,
  sku: p.sku,
  barcode: p.barcode,
  name: p.productName,
  description: p.description,
  category: p.category,
  brand: p.brand || "",
  unitPrice: p.price || 0,
  costPrice: p.costPrice || 0,
  quantity: p.stockQuantity || 0,
  minStockLevel: p.reorderLevel || 0,
  warehouseStock: p.warehouseStock || {},
  warehouseId: p.warehouseId || "",
  unit: p.unit || "pcs",
  imageUrl: p.imageUrl || "",
  expiryDate: p.expiryDate || "",
  status: p.stockQuantity <= 0 ? "out_of_stock" : (p.stockQuantity <= (p.reorderLevel || 0) ? "low_stock" : "in_stock"),
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const mapProductToBackend = (p) => ({
  id: p.id,
  sku: p.sku,
  barcode: p.barcode || "",
  productName: p.name,
  description: p.description || "",
  category: p.category || "General",
  brand: p.brand || "",
  price: p.unitPrice || 0,
  costPrice: p.costPrice || 0,
  stockQuantity: p.quantity || 0,
  reorderLevel: p.minStockLevel || p.minStock || 0,
  warehouseStock: p.warehouseStock || {},
  warehouseId: p.warehouseId || "",
  unit: p.unit || "pcs",
  imageUrl: p.imageUrl || "",
  expiryDate: p.expiryDate || null,
  isActive: true,
});

const mapSupplierFromBackend = (s) => ({
  id: s.id,
  name: s.supplierName,
  contactPerson: s.contactPerson || "",
  email: s.email || "",
  phone: s.phone || "",
  address: s.address || "",
  pricingTier: s.pricingTier || "standard",
  rating: s.rating || 0.0,
  totalOrders: 0,
  totalSpent: 0,
  status: (s.isActive ?? s.active) ? "active" : "inactive",
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

const mapSupplierToBackend = (s) => ({
  id: s.id,
  supplierName: s.name,
  contactPerson: s.contactPerson || "",
  email: s.email || "",
  phone: s.phone || "",
  address: s.address || "",
  pricingTier: s.pricingTier || "standard",
  isActive: s.status === "active",
  active: s.status === "active",
  rating: s.rating || 0.0,
});

const mapWarehouseFromBackend = (w) => ({
  id: w.id,
  name: w.warehouseName,
  address: w.address || "",
  city: w.city || "",
  state: w.state || "",
  country: w.country || "",
  location: w.city ? `${w.city}, ${w.state || ""}` : w.address || "",
  manager: w.managerName || "",
  managerEmail: w.managerEmail || "",
  capacity: w.capacity || 10000,
  status: (w.isActive ?? w.active) ? "active" : "inactive",
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
});

const mapWarehouseToBackend = (w) => {
  const parts = (w.location || "").split(", ");
  return {
    id: w.id,
    warehouseName: w.name,
    address: w.address || w.location || "",
    city: parts[0] || "",
    state: parts[1] || "",
    country: "India",
    managerName: w.manager || "",
    managerEmail: w.managerEmail || "",
    capacity: w.capacity || 10000,
    isActive: w.status === "active",
    active: w.status === "active",
  };
};

const mapPOFromBackend = (po) => ({
  id: po.id,
  orderNumber: po.poNumber || po.id,
  supplierId: po.supplierId,
  supplierName: po.supplierName,
  supplierEmail: po.supplierEmail || "",
  status: (po.status || "DRAFT").toLowerCase(),
  items: (po.items || []).map(item => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.subtotal || (item.quantity * item.unitPrice)
  })),
  totalAmount: po.totalAmount,
  orderDate: po.orderDate,
  expectedDelivery: po.expectedDeliveryDate,
  notes: po.notes || "",
  createdBy: po.createdBy || "System",
});

const mapPOToBackend = (po) => ({
  id: po.id,
  poNumber: po.orderNumber,
  supplierId: po.supplierId,
  supplierName: po.supplierName,
  supplierEmail: po.supplierEmail || "",
  orderDate: po.orderDate ? po.orderDate.split("T")[0] : new Date().toISOString().split("T")[0],
  expectedDeliveryDate: po.expectedDelivery ? po.expectedDelivery.split("T")[0] : new Date().toISOString().split("T")[0],
  status: (po.status || "DRAFT").toUpperCase(),
  totalAmount: po.totalAmount || po.items.reduce((sum, item) => sum + item.total, 0),
  items: (po.items || []).map(item => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.total || (item.quantity * item.unitPrice)
  })),
  notes: po.notes || "",
  createdBy: po.createdBy || "System"
});

const mapSOFromBackend = (so) => ({
  id: so.id,
  orderNumber: so.orderNumber,
  customerId: so.customerId || "",
  customerName: so.customerName,
  customerEmail: so.customerEmail || "",
  status: (so.status || "PENDING").toLowerCase(),
  items: (so.items || []).map(item => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    total: item.subtotal || (item.quantity * item.unitPrice)
  })),
  totalAmount: so.totalAmount,
  orderDate: so.orderDate,
  shippedDate: so.shippedDate,
  deliveredDate: so.deliveredDate,
  trackingNumber: so.trackingNumber || "",
  notes: so.notes || "",
});

const mapSOToBackend = (so) => {
  const result = {
    id: so.id,
    orderNumber: so.orderNumber,
    customerId: so.customerId || "",
    customerName: so.customerName,
    customerEmail: so.customerEmail || "",
    status: (so.status || "PENDING").toUpperCase(),
    totalAmount: so.totalAmount || (so.items || []).reduce((sum, item) => sum + item.total, 0),
    items: (so.items || []).map(item => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.total || (item.quantity * item.unitPrice)
    })),
    notes: so.notes || "",
    trackingNumber: so.trackingNumber || "",
  };
  if (so.orderDate) result.orderDate = so.orderDate;
  if (so.shippedDate) result.shippedDate = so.shippedDate;
  if (so.deliveredDate) result.deliveredDate = so.deliveredDate;
  return result;
};

const mapAuditLogFromBackend = (log) => {
  const act = (log.action || "").toLowerCase();
  let type = "system";
  if (act.includes("scan_in") || act.includes("stock_in") || act.includes("received")) {
    type = "stock_in";
  } else if (act.includes("scan_out") || act.includes("stock_out") || act.includes("shipped")) {
    type = "stock_out";
  } else if (act.includes("po") || act.includes("order") || act.includes("sale")) {
    type = "order";
  } else if (act.includes("user")) {
    type = "user";
  }

  // Spring LocalDateTime may serialize as array [y,mo,d,h,min,s] or ISO string without 'Z'
  let ts = log.timestamp;
  if (!ts) {
    ts = new Date().toISOString();
  } else if (Array.isArray(ts)) {
    // [year, month(1-based), day, hour, minute, second]
    const [y, mo, d, h = 0, min = 0, s = 0] = ts;
    ts = new Date(Date.UTC(y, mo - 1, d, h, min, s)).toISOString();
  } else if (typeof ts === "string" && !ts.endsWith("Z") && !ts.includes("+")) {
    ts += "Z";
  }

  return {
    id: log.id,
    action: log.action ? log.action.replace(/_/g, " ") : "System Action",
    description: log.description || "",
    user: log.userName || log.userId || "System",
    timestamp: ts,
    type,
    module: log.module || "",
  };
};

const DataContext = createContext(undefined);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const userName = user?.name || "System";

  // State initialization
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [stockLogs, setStockLogs] = useState([]);
  const [globalSearch, setGlobalSearch] = useState("");

  const [restockRequests, setRestockRequests] = useState(() => {
    try {
      const stored = localStorage.getItem("stockwise-restock-requests");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist restock requests to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("stockwise-restock-requests", JSON.stringify(restockRequests));
    } catch (err) {
      console.error("Failed to save restock requests:", err);
    }
  }, [restockRequests]);

  // Loading states
  const [productsLoading, setProductsLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [purchaseOrdersLoading, setPurchaseOrdersLoading] = useState(false);
  const [salesOrdersLoading, setSalesOrdersLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [stockLogsLoading, setStockLogsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchGuards = useRef({
    products: false,
    suppliers: false,
    warehouses: false,
    purchaseOrders: false,
    salesOrders: false,
    auditLogs: false,
    notifications: false,
    stockLogs: false,
  });

  // Reset all states and guards when user changes/logs out
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSuppliers([]);
      setPurchaseOrders([]);
      setSalesOrders([]);
      setWarehouses([]);
      setNotifications([]);
      setActivityLogs([]);
      setStockLogs([]);
      // NOTE: restockRequests are intentionally NOT cleared on logout.
      // They are stored in localStorage so managers can see requests
      // submitted by warehouse staff across login sessions.
      setIsLoaded(false);
      setIsLoading(false);
      fetchGuards.current = {
        products: false,
        suppliers: false,
        warehouses: false,
        purchaseOrders: false,
        salesOrders: false,
        auditLogs: false,
        notifications: false,
      };
    }
  }, [user]);

  // On-demand fetch actions
  const fetchProducts = useCallback(async (force = false) => {
    if (fetchGuards.current.products && !force) return;
    fetchGuards.current.products = true;
    setProductsLoading(true);
    try {
      const res = await get("/products");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setProducts(list.map(mapProductFromBackend));
      }
    } catch (err) {
      console.error("Failed to load products:", err);
      fetchGuards.current.products = false;
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchSuppliers = useCallback(async (force = false) => {
    if (fetchGuards.current.suppliers && !force) return;
    fetchGuards.current.suppliers = true;
    setSuppliersLoading(true);
    try {
      const res = await get("/suppliers");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setSuppliers(list.map(mapSupplierFromBackend));
      }
    } catch (err) {
      console.error("Failed to load suppliers:", err);
      fetchGuards.current.suppliers = false;
    } finally {
      setSuppliersLoading(false);
    }
  }, []);

  const fetchWarehouses = useCallback(async (force = false) => {
    if (fetchGuards.current.warehouses && !force) return;
    fetchGuards.current.warehouses = true;
    setWarehousesLoading(true);
    try {
      const res = await get("/warehouses");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setWarehouses(list.map(mapWarehouseFromBackend));
      }
    } catch (err) {
      console.error("Failed to load warehouses:", err);
      fetchGuards.current.warehouses = false;
    } finally {
      setWarehousesLoading(false);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async (force = false) => {
    if (fetchGuards.current.purchaseOrders && !force) return;
    fetchGuards.current.purchaseOrders = true;
    setPurchaseOrdersLoading(true);
    try {
      const res = await get("/purchase-orders");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setPurchaseOrders(list.map(mapPOFromBackend));
      }
    } catch (err) {
      console.error("Failed to load purchase orders:", err);
      fetchGuards.current.purchaseOrders = false;
    } finally {
      setPurchaseOrdersLoading(false);
    }
  }, []);

  const fetchSalesOrders = useCallback(async (force = false) => {
    if (fetchGuards.current.salesOrders && !force) return;
    fetchGuards.current.salesOrders = true;
    setSalesOrdersLoading(true);
    try {
      const res = await get("/sales-orders");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setSalesOrders(list.map(mapSOFromBackend));
      }
    } catch (err) {
      console.error("Failed to load sales orders:", err);
      fetchGuards.current.salesOrders = false;
    } finally {
      setSalesOrdersLoading(false);
    }
  }, []);

  const fetchAuditLogs = useCallback(async (force = false) => {
    if (fetchGuards.current.auditLogs && !force) return;
    fetchGuards.current.auditLogs = false; // reset so we can refetch
    fetchGuards.current.auditLogs = true;
    setAuditLogsLoading(true);
    try {
      const res = await get("/analytics/audit-logs?size=200&sort=timestamp,desc");
      const list = res.content || res;
      if (Array.isArray(list)) {
        setActivityLogs(list.map(mapAuditLogFromBackend));
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      fetchGuards.current.auditLogs = false;
    } finally {
      setAuditLogsLoading(false);
    }
  }, []);

  const fetchStockLogs = useCallback(async (force = false) => {
    if (fetchGuards.current.stockLogs && !force) return;
    fetchGuards.current.stockLogs = true;
    setStockLogsLoading(true);
    try {
      const res = await get("/inventory/logs");
      const list = Array.isArray(res) ? res : [];
      setStockLogs(list);
    } catch (err) {
      console.error("Failed to load stock logs:", err);
      fetchGuards.current.stockLogs = false;
    } finally {
      setStockLogsLoading(false);
    }
  }, []);

  // Helper product status
  const getProductStatus = (qty, minLvl) => {
    if (qty <= 0) return "out_of_stock";
    if (qty <= minLvl) return "low_stock";
    return "in_stock";
  };

  // Helper activity log
  const logActivity = useCallback((action, description, type) => {
    const newLog = {
      id: Math.random().toString(36).slice(2),
      action,
      description,
      user: userName,
      timestamp: new Date().toISOString(),
      type,
    };
    setActivityLogs((prev) => [newLog, ...prev]);
  }, [userName]);

  // Fetch notifications from MongoDB backend
  const fetchNotifications = useCallback(async (force = false) => {
    if (fetchGuards.current.notifications && !force) return;
    fetchGuards.current.notifications = true;
    try {
      const res = await get("/notifications");
      const list = Array.isArray(res) ? res : (res.content || []);
      setNotifications(list.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type || "info",
        read: n.read ?? false,
        createdAt: n.createdAt,
      })));
    } catch (err) {
      console.error("Failed to load notifications:", err);
      fetchGuards.current.notifications = false;
    }
  }, []);

  // Helper notification — persists to MongoDB
  const addNotification = useCallback(async (title, message, type) => {
    const payload = { title, message, type, read: false };
    // Optimistic update
    const tempId = Math.random().toString(36).slice(2);
    const tempNotif = { id: tempId, title, message, type, read: false, createdAt: new Date().toISOString() };
    setNotifications((prev) => [tempNotif, ...prev]);
    try {
      const saved = await post("/notifications", payload);
      setNotifications((prev) => prev.map(n => n.id === tempId ? {
        ...saved,
        id: saved.id,
        read: saved.read ?? false,
        createdAt: saved.createdAt,
      } : n));
    } catch (err) {
      console.error("Failed to save notification:", err);
    }
  }, []);

  // --------------------------------------------------------
  // PRODUCTS METHODS
  // --------------------------------------------------------
  const addProduct = useCallback(async (p) => {
    try {
      const payload = mapProductToBackend(p);
      delete payload.id; // Let MongoDB generate ID
      const saved = await post("/products", payload);
      const mapped = mapProductFromBackend(saved);
      setProducts((prev) => [mapped, ...prev]);

      logActivity("Add Product", `Product "${mapped.name}" (${mapped.sku}) added to inventory.`, "stock_in");
      addNotification("Product Created", `Product ${mapped.name} was added by ${userName}.`, "success");
      
      if (mapped.status === "low_stock" || mapped.status === "out_of_stock") {
        addNotification(
          mapped.status === "out_of_stock" ? "Product Out of Stock" : "Product Low Stock Alert",
          `Product "${mapped.name}" runs low/out of stock. Current total: ${mapped.quantity}.`,
          mapped.status === "out_of_stock" ? "error" : "warning"
        );
      }
      toast.success(`Product "${mapped.name}" added successfully.`);
      
      // Save audit log to backend
      await post("/analytics/audit-logs", {
        action: "PRODUCT_CREATED",
        module: "INVENTORY",
        description: `Product ${mapped.name} created`,
        entityId: mapped.id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add product: " + err.message);
    }
  }, [userName, logActivity, addNotification]);

  const updateProduct = useCallback(async (id, updates) => {
    try {
      const existing = products.find((p) => p.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const payload = mapProductToBackend(merged);

      // Optimistically update UI immediately so the user sees the change
      setProducts((prev) => prev.map((p) => (p.id === id ? merged : p)));

      let mapped = merged; // default to local merge
      try {
        const saved = await put(`/products/${id}`, payload);
        // Only use backend response if it's a valid object with an id
        if (saved && saved.id) {
          mapped = mapProductFromBackend(saved);
          setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
        }
      } catch (putErr) {
        // If PUT fails, revert optimistic update
        setProducts((prev) => prev.map((p) => (p.id === id ? existing : p)));
        throw putErr;
      }

      logActivity("Update Product", `Product "${mapped.name}" details updated.`, "system");
      
      if (mapped.status === "low_stock" || mapped.status === "out_of_stock") {
        addNotification(
          mapped.status === "out_of_stock" ? "Product Out of Stock" : "Product Low Stock Alert",
          `Product "${mapped.name}" runs low/out of stock. Current total: ${mapped.quantity}.`,
          mapped.status === "out_of_stock" ? "error" : "warning"
        );
      }
      toast.success(`Product "${mapped.name}" updated successfully.`);

      await post("/analytics/audit-logs", {
        action: "PRODUCT_UPDATED",
        module: "INVENTORY",
        description: `Product ${mapped.name} updated`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update product: " + err.message);
    }
  }, [products, userName, logActivity, addNotification]);

  const deleteProduct = useCallback(async (id) => {
    try {
      const pName = products.find((p) => p.id === id)?.name || "Unknown Product";
      await del(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      
      logActivity("Delete Product", `Product "${pName}" removed from system.`, "system");
      addNotification("Product Deleted", `Product "${pName}" was deleted by ${userName}.`, "warning");
      toast.success(`Product "${pName}" deleted successfully.`);

      await post("/analytics/audit-logs", {
        action: "PRODUCT_DELETED",
        module: "INVENTORY",
        description: `Product ${pName} deleted`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete product: " + err.message);
    }
  }, [products, userName, logActivity, addNotification]);

  const adjustProductStock = useCallback(async (id, quantityChange, action, warehouseName = null) => {
    try {
      const saved = await post("/inventory/update-stock", {
        productId: id,
        quantity: quantityChange,
        actionType: action === "in" ? "IN" : (action === "out" ? "OUT" : "ADJUSTMENT"),
        warehouse: warehouseName
      });
      const mapped = mapProductFromBackend(saved);
      setProducts((prev) => prev.map((p) => (p.id === id ? mapped : p)));
      
      // Refetch stock logs to update movement charts immediately
      fetchStockLogs(true);

      logActivity(
        action === "in" ? "Stock Scan In" : "Stock Scan Out",
        `${action === "in" ? "Added" : "Removed"} ${quantityChange} units of "${mapped.name}".`,
        action === "in" ? "stock_in" : "stock_out"
      );
      
      if (mapped.status === "low_stock" || mapped.status === "out_of_stock") {
        addNotification(
          mapped.status === "out_of_stock" ? "Product Out of Stock" : "Product Low Stock Alert",
          `Product "${mapped.name}" runs low/out of stock. Current total: ${mapped.quantity}.`,
          mapped.status === "out_of_stock" ? "error" : "warning"
        );
      }
      toast.success(`Adjusted stock of "${mapped.name}" by ${action === "in" ? "+" : "-"}${quantityChange} units.`);

      await post("/analytics/audit-logs", {
        action: action === "in" ? "STOCK_SCAN_IN" : "STOCK_SCAN_OUT",
        module: "INVENTORY",
        description: `${action === "in" ? "Added" : "Removed"} ${quantityChange} units`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to adjust stock: " + err.message);
    }
  }, [userName, logActivity, addNotification, fetchStockLogs]);

  // --------------------------------------------------------
  // SUPPLIERS METHODS
  // --------------------------------------------------------
  const addSupplier = useCallback(async (s) => {
    try {
      const payload = mapSupplierToBackend(s);
      delete payload.id;
      const saved = await post("/suppliers", payload);
      const mapped = mapSupplierFromBackend(saved);
      setSuppliers((prev) => [mapped, ...prev]);

      logActivity("Add Supplier", `Supplier "${mapped.name}" added to network.`, "system");
      toast.success(`Supplier "${mapped.name}" added successfully.`);

      await post("/analytics/audit-logs", {
        action: "SUPPLIER_ADDED",
        module: "SUPPLIER_CUSTOMER",
        description: `Supplier ${mapped.name} added`,
        entityId: mapped.id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add supplier: " + err.message);
    }
  }, [userName, logActivity]);

  const updateSupplier = useCallback(async (id, updates) => {
    try {
      const existing = suppliers.find((s) => s.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const payload = mapSupplierToBackend(merged);
      const saved = await put(`/suppliers/${id}`, payload);
      const mapped = mapSupplierFromBackend(saved);

      setSuppliers((prev) => prev.map((s) => (s.id === id ? mapped : s)));
      logActivity("Update Supplier", `Supplier "${mapped.name}" details updated.`, "system");
      toast.success(`Supplier "${mapped.name}" updated successfully.`);

      await post("/analytics/audit-logs", {
        action: "SUPPLIER_UPDATED",
        module: "SUPPLIER_CUSTOMER",
        description: `Supplier ${mapped.name} updated`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update supplier: " + err.message);
    }
  }, [suppliers, userName, logActivity]);

  const deleteSupplier = useCallback(async (id) => {
    try {
      const sName = suppliers.find((s) => s.id === id)?.name || "Unknown Supplier";
      await del(`/suppliers/${id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));

      logActivity("Remove Supplier", `Supplier "${sName}" removed from system.`, "system");
      toast.success(`Supplier "${sName}" removed successfully.`);

      await post("/analytics/audit-logs", {
        action: "SUPPLIER_DELETED",
        module: "SUPPLIER_CUSTOMER",
        description: `Supplier ${sName} deleted`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
    }
  }, [suppliers, userName, logActivity]);

  // --------------------------------------------------------
  // PURCHASE ORDERS METHODS
  // --------------------------------------------------------
  const addPurchaseOrder = useCallback(async (po) => {
    try {
      const orderNumber = `PO-${1000 + purchaseOrders.length + 1}`;
      const totalAmount = po.items.reduce((sum, item) => sum + item.total, 0);

      const payload = mapPOToBackend({
        ...po,
        orderNumber,
        totalAmount,
        status: "draft",
        createdBy: userName
      });
      delete payload.id;

      const saved = await post("/purchase-orders", payload);
      const mapped = mapPOFromBackend(saved);
      setPurchaseOrders((prev) => [mapped, ...prev]);

      logActivity("Create PO", `Purchase Order "${mapped.orderNumber}" created in draft status.`, "order");
      toast.success(`Purchase Order "${mapped.orderNumber}" created successfully as Draft.`);

      await post("/analytics/audit-logs", {
        action: "PO_CREATED",
        module: "PURCHASE",
        description: `Purchase Order ${mapped.orderNumber} created`,
        entityId: mapped.id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create purchase order: " + err.message);
    }
  }, [purchaseOrders.length, userName, logActivity]);

  const updatePurchaseOrder = useCallback(async (id, updates) => {
    try {
      const existing = purchaseOrders.find((o) => o.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };

      if (updates.status && updates.status !== existing.status) {
        const saved = await put(`/purchase-orders/${id}/status?status=${updates.status.toUpperCase()}`);
        const mapped = mapPOFromBackend(saved);
        setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? mapped : o)));
      } else {
        setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? merged : o)));
      }
      toast.success("Purchase Order details updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update purchase order: " + err.message);
    }
  }, [purchaseOrders]);

  const cancelPurchaseOrder = useCallback(async (id) => {
    try {
      const saved = await put(`/purchase-orders/${id}/status?status=CANCELLED`);
      const mapped = mapPOFromBackend(saved);
      setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? mapped : o)));
      toast.success("Purchase Order cancelled.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel purchase order: " + err.message);
    }
  }, []);

  const deletePurchaseOrder = useCallback(async (id) => {
    try {
      const poNumber = purchaseOrders.find(o => o.id === id)?.orderNumber || id;
      await del(`/purchase-orders/${id}`);
      setPurchaseOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success(`Purchase Order ${poNumber} permanently deleted.`);

      await post("/analytics/audit-logs", {
        action: "PO_DELETED",
        module: "PURCHASE",
        description: `Purchase Order ${poNumber} deleted`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete purchase order: " + err.message);
    }
  }, [purchaseOrders, userName]);

  const sendPurchaseOrder = useCallback(async (id) => {
    try {
      const saved = await put(`/purchase-orders/${id}/status?status=SENT`);
      const mapped = mapPOFromBackend(saved);
      setPurchaseOrders((prev) => prev.map((o) => (o.id === id ? mapped : o)));
      
      logActivity("Send PO", `Sent Purchase Order "${mapped.orderNumber}" to supplier "${mapped.supplierName}".`, "order");
      toast.success(`Purchase Order "${mapped.orderNumber}" sent to supplier.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send purchase order: " + err.message);
    }
  }, [logActivity]);

  const receivePurchaseOrder = useCallback(async (id) => {
    try {
      const po = purchaseOrders.find((o) => o.id === id);
      if (!po) return;

      const receiptPayload = {
        poId: po.id,
        poNumber: po.orderNumber,
        receivedDate: new Date().toISOString().split("T")[0],
        receivedBy: userName,
        remarks: "Received full PO via frontend scan",
        receivedItems: po.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.total
        }))
      };

      await post("/goods-receipt", receiptPayload);

      // Refresh POs, Products and Suppliers from MongoDB to get updated stocks/spending
      const poPage = await get("/purchase-orders");
      if (poPage) {
        const list = poPage.content || poPage;
        setPurchaseOrders(list.map(mapPOFromBackend));
      }

      const prodRes = await get("/products");
      if (prodRes) {
        const list = prodRes.content || prodRes;
        setProducts(list.map(mapProductFromBackend));
      }

      const supRes = await get("/suppliers");
      if (supRes) {
        const list = supRes.content || supRes;
        setSuppliers(list.map(mapSupplierFromBackend));
      }

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
    } catch (err) {
      console.error(err);
      toast.error("Failed to receive goods: " + err.message);
    }
  }, [purchaseOrders, userName, logActivity, addNotification]);

  // --------------------------------------------------------
  // SALES ORDERS METHODS
  // --------------------------------------------------------
  const addSalesOrder = useCallback(async (so) => {
    try {
      // Check stock availability locally first
      for (const item of so.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod || prod.quantity < item.quantity) {
          toast.error(`Insufficient stock for product "${item.productName}". Available: ${prod?.quantity || 0}`);
          return;
        }
      }

      const orderNumber = `SO-${2000 + salesOrders.length + 1}`;
      const totalAmount = so.items.reduce((sum, item) => sum + item.total, 0);

      const payload = mapSOToBackend({
        ...so,
        orderNumber,
        totalAmount,
        status: "pending"
      });
      delete payload.id;

      const saved = await post("/sales-orders", payload);
      const mapped = mapSOFromBackend(saved);
      setSalesOrders((prev) => [mapped, ...prev]);

      // Refresh products from MongoDB since stock levels were deducted
      const prodRes = await get("/products");
      if (prodRes) {
        const list = prodRes.content || prodRes;
        setProducts(list.map(mapProductFromBackend));
      }

      logActivity("Create Sale", `Sales Order "${mapped.orderNumber}" registered. Stock dispatched.`, "stock_out");
      toast.success(`Sales Order "${mapped.orderNumber}" created successfully.`);

      await post("/analytics/audit-logs", {
        action: "SALES_ORDER_CREATED",
        module: "SALES",
        description: `Sales Order ${mapped.orderNumber} created`,
        entityId: mapped.id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create sales order: " + err.message);
    }
  }, [products, salesOrders.length, userName, logActivity]);

  const updateSalesOrder = useCallback(async (id, updates) => {
    try {
      const existing = salesOrders.find((o) => o.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const payload = mapSOToBackend(merged);
      const saved = await put(`/sales-orders/${id}`, payload);
      const mapped = mapSOFromBackend(saved);

      setSalesOrders((prev) => prev.map((o) => (o.id === id ? mapped : o)));
      toast.success("Sales Order details updated.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update sales order: " + err.message);
    }
  }, [salesOrders]);

  const deleteSalesOrder = useCallback(async (id) => {
    try {
      await del(`/sales-orders/${id}`);
      // Backend soft-deletes by setting status=CANCELLED, so reflect that in state
      setSalesOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" } : o));
      toast.success("Sales Order cancelled.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel sales order: " + err.message);
    }
  }, []);

  const markSalesOrderShipped = useCallback(async (id, trackingNumber) => {
    try {
      const so = salesOrders.find((o) => o.id === id);
      if (!so) return;

      const dispatchPayload = {
        salesOrderId: so.id,
        orderNumber: so.orderNumber,
        dispatchDate: new Date().toISOString().substring(0, 19),
        trackingNumber,
        carrier: "FedEx",
        status: "DISPATCHED",
        dispatchedBy: userName
      };

      // Optimistically update local state immediately
      setSalesOrders((prev) =>
        prev.map((o) => o.id === id ? { ...o, status: "shipped", trackingNumber } : o)
      );

      await post("/dispatch", dispatchPayload);

      // Refresh from backend to confirm
      const soRes = await get("/sales-orders");
      if (soRes) {
        const list = soRes.content || soRes;
        setSalesOrders(list.map(mapSOFromBackend));
      }

      logActivity("Ship Order", `Order "${so.orderNumber}" marked as shipped. Tracking ID: ${trackingNumber}`, "order");
      toast.success(`Order "${so.orderNumber}" shipped successfully.`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to mark order as shipped: " + err.message);
    }
  }, [salesOrders, userName, logActivity]);

  // --------------------------------------------------------
  // WAREHOUSES METHODS
  // --------------------------------------------------------
  const addWarehouse = useCallback(async (w) => {
    try {
      const payload = mapWarehouseToBackend(w);
      delete payload.id;
      const saved = await post("/warehouses", payload);
      const mapped = mapWarehouseFromBackend(saved);
      setWarehouses((prev) => [mapped, ...prev]);

      logActivity("Add Warehouse", `Warehouse "${mapped.name}" in ${mapped.location} registered.`, "system");
      toast.success(`Warehouse "${mapped.name}" added successfully.`);

      await post("/analytics/audit-logs", {
        action: "WAREHOUSE_CREATED",
        module: "INVENTORY",
        description: `Warehouse ${mapped.name} created`,
        entityId: mapped.id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to add warehouse: " + err.message);
    }
  }, [userName, logActivity]);

  const updateWarehouse = useCallback(async (id, updates) => {
    try {
      const existing = warehouses.find((w) => w.id === id);
      if (!existing) return;
      const merged = { ...existing, ...updates };
      const payload = mapWarehouseToBackend(merged);
      const saved = await put(`/warehouses/${id}`, payload);
      const mapped = mapWarehouseFromBackend(saved);

      setWarehouses((prev) => prev.map((w) => (w.id === id ? mapped : w)));
      toast.success("Warehouse updated.");

      await post("/analytics/audit-logs", {
        action: "WAREHOUSE_UPDATED",
        module: "INVENTORY",
        description: `Warehouse ${mapped.name} updated`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update warehouse: " + err.message);
    }
  }, [warehouses, userName, logActivity]);

  const deleteWarehouse = useCallback(async (id) => {
    try {
      await del(`/warehouses/${id}`);
      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      toast.success("Warehouse deleted.");

      await post("/analytics/audit-logs", {
        action: "WAREHOUSE_DELETED",
        module: "INVENTORY",
        description: `Warehouse ${id} deleted`,
        entityId: id,
        userName
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete warehouse: " + err.message);
    }
  }, [userName, logActivity]);

  const clearAuditLogs = useCallback(async () => {
    try {
      await del("/analytics/audit-logs");
      setActivityLogs([]);
      toast.success("Audit logs cleared successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear audit logs: " + err.message);
    }
  }, []);

  // --------------------------------------------------------
  // NOTIFICATIONS METHODS
  // --------------------------------------------------------
  const markNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await put("/notifications/mark-read");
    } catch (err) {
      console.error("Failed to mark notifications read on backend:", err);
    }
    toast.success("All notifications marked as read.");
  }, []);

  // --------------------------------------------------------
  // RESTOCK REQUESTS METHODS
  // --------------------------------------------------------
  const addRestockRequest = useCallback((req) => {
    setRestockRequests((prev) => {
      const alreadySent = prev.find((r) => r.productId === req.productId && r.status === "pending");
      if (alreadySent) return prev;
      return [req, ...prev];
    });
  }, []);

  const addBulkRestockRequests = useCallback((reqs) => {
    setRestockRequests((prev) => {
      const filtered = reqs.filter(req => !prev.some(r => r.productId === req.productId && r.status === "pending"));
      return [...filtered, ...prev];
    });
  }, []);

  const updateRestockRequestStatus = useCallback((id, status) => {
    setRestockRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }, []);

  // --------------------------------------------------------
  // COMPUTED DASHBOARD STATISTICS
  // --------------------------------------------------------
  const stats = useMemo(() => {
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
        stockLogs,
        stats,
        isLoading,
        isLoaded,
        fetchProducts,
        fetchSuppliers,
        fetchPurchaseOrders,
        fetchSalesOrders,
        fetchWarehouses,
        fetchAuditLogs,
        fetchStockLogs,
        fetchNotifications,
        productsLoading,
        suppliersLoading,
        purchaseOrdersLoading,
        salesOrdersLoading,
        warehousesLoading,
        auditLogsLoading,
        stockLogsLoading,
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
        cancelPurchaseOrder,
        sendPurchaseOrder,
        receivePurchaseOrder,
        addSalesOrder,
        updateSalesOrder,
        deleteSalesOrder,
        markSalesOrderShipped,
        addWarehouse,
        updateWarehouse,
        deleteWarehouse,
        clearAuditLogs,
        addNotification,
        markNotificationsRead,
        globalSearch,
        setGlobalSearch,
        restockRequests,
        addRestockRequest,
        addBulkRestockRequests,
        updateRestockRequestStatus,
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
