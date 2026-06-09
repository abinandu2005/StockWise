import { useState } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import {
  LayoutDashboard, Package, ShoppingCart, Truck, Users,
  BarChart3, Settings, ChevronLeft, ChevronRight, ClipboardList,
  Warehouse, Bell, FileText, LogOut, Shield, PackageCheck,
  AlertTriangle, Activity, Send,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";



const navSections = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { label: "Notifications", path: "/notifications", icon: Bell },
      { label: "My Activity", path: "/my-activity", icon: Activity, permission: "view_own_activity" },
    ],
  },
  {
    title: "Inventory",
    items: [
      { label: "Products", path: "/inventory", icon: Package },
      { label: "Stock Receive", path: "/stock-receive", icon: PackageCheck, permission: "receive_shipments" },
      { label: "Upcoming Shipments", path: "/stock-receive", icon: Truck, permission: "view_upcoming_shipments" },
      { label: "Stock Alerts", path: "/stock-alerts", icon: AlertTriangle, permission: "view_stock_alerts" },
      { label: "Warehouses", path: "/warehouses", icon: Warehouse, permission: "manage_warehouses" },
    ],
  },
  {
    title: "Orders",
    items: [
      { label: "Purchase Orders", path: "/purchase-orders", icon: ShoppingCart, permission: "manage_orders" },
      { label: "Sales Orders", path: "/sales-orders", icon: ClipboardList, permission: "manage_orders" },
      { label: "Sales Dispatch", path: "/sales-orders", icon: Send, permission: "dispatch_sales" },
      { label: "Restock Requests", path: "/restock-requests", icon: FileText, permission: "view_restock_requests" },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Suppliers", path: "/suppliers", icon: Users, permission: "manage_suppliers" },
      { label: "Reports", path: "/reports", icon: BarChart3, permission: "view_reports" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Audit Logs", path: "/audit-logs", icon: Shield, permission: "access_audit_logs" },
      { label: "User Management", path: "/users", icon: Users, permission: "manage_users" },
      { label: "Settings", path: "/settings", icon: Settings },
    ],
  },
];



export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const { hasPermission, user, logout } = useAuth();
  const { notifications } = useData();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 68 : 256 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="fixed left-0 top-0 z-40 hidden h-screen border-r bg-sidebar lg:flex flex-col"
      >
        {/* Logo */}
        <Link
          to="/"
          className="flex h-14 items-center gap-2 border-b px-4 hover:opacity-80 transition-opacity"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-transparent overflow-hidden">
            <img src="/logo.png" alt="StockWise Logo" className="h-8 w-8 object-contain" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-base font-semibold tracking-tight overflow-hidden whitespace-nowrap text-foreground"
              >
                StockWise
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-1 px-2">
            {filteredSections.map((section, idx) => (
              <div key={section.title}>
                {idx > 0 && <Separator className="my-2" />}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mb-1 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground"
                    >
                      {section.title}
                    </motion.p>
                  )}
                </AnimatePresence>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const hasBadge = item.path === "/notifications" ? unreadCount > 0 : !!item.badge;
                  const badgeValue = item.path === "/notifications" ? unreadCount : item.badge;

                  const linkContent = (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="overflow-hidden whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                      {!collapsed && hasBadge && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                          {badgeValue}
                        </span>
                      )}
                    </NavLink>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.path}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.path}>{linkContent}</div>;
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Bottom section */}
        <div className="border-t p-2">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
