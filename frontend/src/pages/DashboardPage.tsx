import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package, DollarSign, AlertTriangle, ShoppingCart,
  TrendingUp, ArrowUpRight, ArrowDownRight, Activity,
  Plus, Scan, FileText, Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import {
  mockInventoryChart, mockActivityLogs, mockRevenueChart,
} from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";

const CHART_COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const { products, purchaseOrders, salesOrders, warehouses } = useData();
  const navigate = useNavigate();

  // Dynamic Statistics
  const totalProducts = products.length;
  
  const totalStockValue = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.status === "low_stock" || p.status === "out_of_stock");
  }, [products]);

  const pendingOrdersCount = useMemo(() => {
    const pendingPO = purchaseOrders.filter(o => o.status === "sent" || o.status === "partially_received").length;
    const pendingSO = salesOrders.filter(o => o.status === "pending" || o.status === "processing").length;
    return pendingPO + pendingSO;
  }, [purchaseOrders, salesOrders]);

  // Live Activity Logs (combine local storage with mock logs)
  const recentLogs = useMemo(() => {
    const local = localStorage.getItem("stockwise-activity-logs");
    const stored = local ? JSON.parse(local) : [];
    return [...stored, ...mockActivityLogs].slice(0, 5);
  }, []);

  // Category Distribution calculation based on real products
  const categoryChartData = useMemo(() => {
    const distribution: Record<string, number> = {};
    products.forEach((p) => {
      distribution[p.category] = (distribution[p.category] || 0) + p.quantity;
    });

    const entries = Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Limit to top 4 categories
    return entries.slice(0, 4);
  }, [products]);

  // Dynamic Warehouse Stock Counts helper
  const getWarehouseStock = (warehouseName: string) => {
    return products.reduce((sum, p) => sum + (p.warehouseStock[warehouseName] || 0), 0);
  };

  const kpiCards = [
    {
      title: "Total Products Keeping",
      value: formatNumber(totalProducts),
      change: "+12",
      trend: "up" as const,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Asset Valuation",
      value: formatCurrency(totalStockValue),
      change: "+4.8%",
      trend: "up" as const,
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Low Stock Alerts",
      value: lowStockProducts.length.toString(),
      change: lowStockProducts.length > 5 ? "+5" : "0",
      trend: lowStockProducts.length > 5 ? ("up" as const) : ("down" as const),
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Pending Orders Dispatch",
      value: pendingOrdersCount.toString(),
      change: "Active",
      trend: "up" as const,
      icon: ShoppingCart,
      color: "text-violet-600 dark:text-violet-400",
      bgColor: "bg-violet-500/10",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening with your inventory network today ({user?.role?.replace("_", " ")})
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("scan_stock") && (
            <Button variant="outline" size="sm" onClick={() => navigate("/inventory")}>
              <Scan className="mr-2 h-4 w-4" />
              Scan Barcode
            </Button>
          )}
          {(user?.role === "admin" || user?.role === "purchase_manager") && (
            <Button size="sm" onClick={() => navigate("/inventory")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.title} variants={item}>
              <Card className="hover:shadow-soft-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${kpi.bgColor}`}>
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      kpi.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-500"
                    }`}>
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {kpi.change}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-semibold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Inventory Movement Chart */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Inventory Movement</CardTitle>
                  <CardDescription>Stock in vs stock out over 6 months</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Monthly</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockInventoryChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="stockIn" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="stockOut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.04)",
                      }}
                    />
                    <Area type="monotone" dataKey="stockIn" name="Stock In" stroke="hsl(221, 83%, 53%)" fill="url(#stockIn)" strokeWidth={2} />
                    <Area type="monotone" dataKey="stockOut" name="Stock Out" stroke="hsl(142, 71%, 45%)" fill="url(#stockOut)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stock by Category</CardTitle>
              <CardDescription>Current inventory distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {categoryChartData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">{cat.name}</span>
                    <span className="ml-auto text-xs font-medium">{cat.value}</span>
                  </div>
                ))}
                {categoryChartData.length === 0 && (
                  <p className="text-xs text-muted-foreground col-span-2 text-center py-4">No categories data.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Low Stock Alerts */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Low Stock Alerts</CardTitle>
                <Badge variant="warning" className="text-[10px]">
                  {lowStockProducts.length} items
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium ${
                    product.status === "out_of_stock"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  }`}>
                    {product.quantity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  <Badge
                    variant={product.status === "out_of_stock" ? "destructive" : "warning"}
                    className="text-[10px] shrink-0"
                  >
                    {product.status === "out_of_stock" ? "Out" : "Low"}
                  </Badge>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  All products are well-stocked
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/audit-logs")}>
                  View all
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLogs.map((log, idx) => (
                <div key={log.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full ${
                      log.action.includes("Scan In") || log.type === "stock_in" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                      log.action.includes("Scan Out") || log.type === "stock_out" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      log.type === "order" || log.action.includes("PO") || log.action.includes("Sale") ? "bg-violet-500/10 text-violet-600 dark:text-violet-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {log.action.includes("Scan In") || log.type === "stock_in" ? <ArrowUpRight className="h-3 w-3" /> :
                       log.action.includes("Scan Out") || log.type === "stock_out" ? <ArrowDownRight className="h-3 w-3" /> :
                       log.type === "order" || log.action.includes("PO") || log.action.includes("Sale") ? <ShoppingCart className="h-3 w-3" /> :
                       <Activity className="h-3 w-3" />}
                    </div>
                    {idx < recentLogs.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-sm font-medium leading-tight">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(log.timestamp)}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Warehouse Summary */}
        <motion.div variants={item} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Warehouses</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/warehouses")}>
                  Manage
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {warehouses.map((wh) => {
                const totalQty = getWarehouseStock(wh.name);
                const usage = wh.capacity > 0 ? (totalQty / wh.capacity) * 100 : 0;
                return (
                  <div key={wh.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{wh.name}</p>
                        <p className="text-xs text-muted-foreground">{wh.location}</p>
                      </div>
                      <Badge
                        variant={wh.status === "active" ? "success" : "secondary"}
                        className="text-[10px] uppercase"
                      >
                        {wh.status}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{formatNumber(totalQty)} units</span>
                        <span>{Math.round(usage)}% capacity</span>
                      </div>
                      <Progress value={Math.min(100, usage)} className="h-1.5" />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue for the current year</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <TrendingUp className="h-4 w-4" />
                  +12.4%
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockRevenueChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Add Product", icon: Plus, path: "/inventory", color: "bg-primary/10 text-primary" },
                { label: "New PO", icon: ShoppingCart, path: "/purchase-orders", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
                { label: "Create Report", icon: FileText, path: "/reports", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                { label: "Add Supplier", icon: Truck, path: "/suppliers", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center gap-2 rounded-xl border p-4 hover:bg-accent transition-colors group"
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color} transition-transform group-hover:scale-110`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
