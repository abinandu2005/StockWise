import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { X, Package, LayoutDashboard, ShoppingCart, ClipboardList, Truck, BarChart3, Settings, Bell, Shield, Warehouse, FileText, LogOut, PackageCheck, AlertTriangle, Activity, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Products", path: "/inventory", icon: Package },
  { label: "Stock Receive", path: "/stock-receive", icon: PackageCheck, permission: "receive_shipments" },
  { label: "Upcoming Shipments", path: "/stock-receive", icon: Truck, permission: "view_upcoming_shipments" },
  { label: "Stock Alerts", path: "/stock-alerts", icon: AlertTriangle, permission: "view_stock_alerts" },
  { label: "My Activity", path: "/my-activity", icon: Activity, permission: "view_own_activity" },
  { label: "Warehouses", path: "/warehouses", icon: Warehouse, permission: "manage_warehouses" },
  { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart, permission: "manage_orders" },
  { label: "Sales Orders", path: "/sales-orders", icon: ClipboardList, permission: "manage_orders" },
  { label: "Sales Dispatch", path: "/sales-orders", icon: Send, permission: "dispatch_sales" },
  { label: "Restock Requests", path: "/restock-requests", icon: AlertTriangle, permission: "view_restock_requests" },
  { label: "Suppliers", path: "/suppliers", icon: Truck, permission: "manage_suppliers" },
  { label: "Reports", path: "/reports", icon: BarChart3, permission: "view_reports" },
  { label: "Notifications", path: "/notifications", icon: Bell },
  { label: "Audit Logs", path: "/audit-logs", icon: FileText, permission: "access_audit_logs" },
  { label: "Users", path: "/users", icon: Shield, permission: "manage_users" },
  { label: "Settings", path: "/settings", icon: Settings },
];

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const filteredNavItems = navItems.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-72 border-r bg-sidebar lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link
                to="/"
                onClick={onClose}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-transparent overflow-hidden">
                  <img src="/logo.png" alt="StockWise Logo" className="h-8 w-8 object-contain" />
                </div>
                <span className="text-base font-semibold text-foreground">StockWise</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Nav Items */}
            <ScrollArea className="flex-1 py-3">
              <nav className="space-y-0.5 px-2">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </ScrollArea>

            {/* Footer removed to move profile/logout exclusively to top navbar */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
