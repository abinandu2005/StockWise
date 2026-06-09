import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Package, ArrowDown, Search, Download,
  Scan, TrendingDown, XCircle, Warehouse, ChevronLeft, ChevronRight, Bell, Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const PER_PAGE = 8;

export default function StockAlertsPage() {
  const { products, warehouses, addNotification, fetchProducts, fetchWarehouses, restockRequests, addRestockRequest, addBulkRestockRequests } = useData();

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, [fetchProducts, fetchWarehouses]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // All low stock and out of stock products
  const alertProducts = useMemo(() => {
    return products
      .filter((p) => p.status === "low_stock" || p.status === "out_of_stock")
      .filter(
        (p) =>
          search === "" ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase())
      )
      .filter(
        (p) => statusFilter === "all" || p.status === statusFilter
      );
  }, [products, search, statusFilter]);

  const lowStockCount = products.filter((p) => p.status === "low_stock").length;
  const outOfStockCount = products.filter((p) => p.status === "out_of_stock").length;

  // Most critical product (out of stock first, then lowest ratio)
  const mostCritical = useMemo(() => {
    const sorted = [...alertProducts].sort((a, b) => {
      if (a.status === "out_of_stock" && b.status !== "out_of_stock") return -1;
      if (b.status === "out_of_stock" && a.status !== "out_of_stock") return 1;
      const ratioA = a.quantity / (a.minStockLevel || a.minStock || 1);
      const ratioB = b.quantity / (b.minStockLevel || b.minStock || 1);
      return ratioA - ratioB;
    });
    return sorted[0] || null;
  }, [alertProducts]);

  const totalPages = Math.ceil(alertProducts.length / PER_PAGE);
  const paginated = alertProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleExportAlerts = () => {
    const data = alertProducts.map((p) => {
      const minLevel = p.minStockLevel || p.minStock || 0;
      const deficit = Math.max(0, minLevel - p.quantity);
      const whBreakdown = Object.entries(p.warehouseStock || {})
        .map(([wh, qty]) => `${wh}: ${qty}`)
        .join(", ");
      return {
        Name: p.name,
        SKU: p.sku,
        Category: p.category,
        Status: p.status === "out_of_stock" ? "Out of Stock" : "Low Stock",
        "Current Qty": p.quantity,
        "Min Stock Level": minLevel,
        Deficit: deficit,
        "Warehouse Breakdown": whBreakdown,
        "Unit Price (₹)": p.unitPrice,
      };
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Stock Alerts");
    XLSX.writeFile(wb, `stockwise_alerts_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Stock alerts exported as Excel (.xlsx).");
  };

  const handleAlertManager = (productId) => {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return;
    const minLevel = p.minStockLevel || p.minStock || 0;
    const deficit = Math.max(0, minLevel - p.quantity);

    const alreadySent = restockRequests.find((r) => r.productId === productId && r.status === "pending");
    if (alreadySent) {
      toast.info(`Alert for "${p.name}" has already been sent to manager.`);
      return;
    }

    const newRequest = {
      id: Math.random().toString(36).slice(2),
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      category: p.category,
      currentQty: p.quantity,
      minStockLevel: minLevel,
      deficit,
      status: "pending",
      requestedBy: user?.name || "Staff",
      requestedAt: new Date().toISOString(),
    };
    addRestockRequest(newRequest);

    // Also create a notification for the manager via DataContext
    addNotification(
      "Restock Request from Staff",
      `${user?.name} requests restock for "${p.name}" (${p.sku}). Current: ${p.quantity}, Min: ${minLevel}, Deficit: ${deficit}.`,
      "warning"
    );

    toast.success(`Manager notified about "${p.name}" restock requirement.`);
  };

  // Alert manager about all low-stock products at once
  const handleAlertAllToManager = () => {
    const reqsToAdd = [];

    alertProducts.forEach((p) => {
      const alreadySent = restockRequests.find((r) => r.productId === p.id && r.status === "pending");
      if (alreadySent) return;

      const minLevel = p.minStockLevel || p.minStock || 0;
      const deficit = Math.max(0, minLevel - p.quantity);
      reqsToAdd.push({
        id: Math.random().toString(36).slice(2),
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category,
        currentQty: p.quantity,
        minStockLevel: minLevel,
        deficit,
        status: "pending",
        requestedBy: user?.name || "Staff",
        requestedAt: new Date().toISOString(),
      });
    });

    if (reqsToAdd.length === 0) {
      toast.info("All alerts have already been sent to manager.");
      return;
    }

    addBulkRestockRequests(reqsToAdd);

    // Create a single summary notification via DataContext
    addNotification(
      "Bulk Restock Alert from Staff",
      `${user?.name} flagged ${reqsToAdd.length} product(s) for restocking. Please review and create purchase orders.`,
      "warning"
    );

    toast.success(`Manager notified about ${reqsToAdd.length} products needing restock.`);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor low-stock and out-of-stock products across warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "warehouse_staff" && alertProducts.length > 0 && (
            <Button variant="default" size="sm" onClick={handleAlertAllToManager} className="bg-amber-600 hover:bg-amber-700 text-white">
              <Send className="mr-2 h-4 w-4" />
              Alert Manager ({alertProducts.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleExportAlerts}>
            <Download className="mr-2 h-4 w-4" />
            Export Alerts
          </Button>
          <Button size="sm" onClick={() => navigate("/inventory")}>
            <Scan className="mr-2 h-4 w-4" />
            Go to Scanner
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{lowStockCount}</p>
                  <p className="text-xs text-muted-foreground">Low Stock Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow border-destructive/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{outOfStockCount}</p>
                  <p className="text-xs text-muted-foreground">Out of Stock Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <AlertTriangle className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold truncate max-w-[180px]">
                    {mostCritical ? mostCritical.name : "All stocked"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {mostCritical
                      ? `${mostCritical.quantity} / ${mostCritical.minStockLevel || mostCritical.minStock || 0} min`
                      : "No critical items"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search & Filter */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or SKU..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <TabsList>
                  <TabsTrigger value="all" className="text-xs">All Alerts</TabsTrigger>
                  <TabsTrigger value="low_stock" className="text-xs">Low Stock</TabsTrigger>
                  <TabsTrigger value="out_of_stock" className="text-xs">Out of Stock</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Alerts Table */}
      <motion.div variants={item}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">SKU</th>
                  <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Current</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Min Level</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Deficit</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">Warehouse Breakdown</th>
                  {user?.role === "warehouse_staff" && (
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map((p, i) => {
                  const minLevel = p.minStockLevel || p.minStock || 0;
                  const deficit = Math.max(0, minLevel - p.quantity);
                  const stockRatio = minLevel > 0 ? (p.quantity / minLevel) * 100 : 0;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            p.status === "out_of_stock" ? "bg-destructive/10" : "bg-amber-500/10"
                          }`}>
                            <Package className={`h-4 w-4 ${
                              p.status === "out_of_stock" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku}</code>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={p.status === "out_of_stock" ? "destructive" : "warning"}
                          className="text-[10px]"
                        >
                          {p.status === "out_of_stock" ? "Out of Stock" : "Low Stock"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="space-y-1">
                          <p className={`text-sm font-semibold ${
                            p.status === "out_of_stock" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                          }`}>
                            {p.quantity}
                          </p>
                          <Progress
                            value={Math.min(100, stockRatio)}
                            className="h-1 w-16 ml-auto"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {minLevel}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-sm font-medium text-destructive">
                          {deficit > 0 ? `-${deficit}` : "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(p.warehouseStock || {}).map(([wh, qty]) => (
                            <span
                              key={wh}
                              className="inline-flex items-center gap-1 text-[11px] bg-muted px-2 py-0.5 rounded-full"
                            >
                              <Warehouse className="h-3 w-3 text-muted-foreground" />
                              {wh}: <span className="font-medium">{qty}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      {user?.role === "warehouse_staff" && (
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                            onClick={() => handleAlertManager(p.id)}
                          >
                            <Bell className="h-3 w-3" />
                            Notify
                          </Button>
                        </td>
                      )}
                    </motion.tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={user?.role === "warehouse_staff" ? 8 : 7} className="py-12 text-center">
                      <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm font-medium">All products are well-stocked!</p>
                      <p className="text-xs text-muted-foreground mt-1">No alerts at this time</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-muted-foreground">
                Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, alertProducts.length)} of{" "}
                {alertProducts.length}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Button
                    key={n}
                    variant={n === page ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
