import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList, BarChart3,
  PackageCheck, AlertTriangle, Activity, Truck, Send,
} from "lucide-react";

const allNavItems = [
  // Shared
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard, roles: ["admin", "warehouse_staff", "purchase_manager"] },
  { label: "Inventory", path: "/inventory", icon: Package, roles: ["admin", "warehouse_staff", "purchase_manager"] },
  // Staff-specific
  { label: "Receive", path: "/stock-receive", icon: PackageCheck, roles: ["warehouse_staff"] },
  { label: "Alerts", path: "/stock-alerts", icon: AlertTriangle, roles: ["warehouse_staff"] },
  { label: "Dispatch", path: "/sales-orders", icon: Send, roles: ["warehouse_staff"] },
  // Manager-specific
  { label: "Purchase", path: "/purchase-orders", icon: ShoppingCart, roles: ["purchase_manager"] },
  { label: "Sales", path: "/sales-orders", icon: ClipboardList, roles: ["purchase_manager"] },
  { label: "Shipments", path: "/stock-receive", icon: Truck, roles: ["purchase_manager"] },
  // Admin
  { label: "Purchase", path: "/purchase-orders", icon: ShoppingCart, roles: ["admin"] },
  { label: "Sales", path: "/sales-orders", icon: ClipboardList, roles: ["admin"] },
  { label: "Reports", path: "/reports", icon: BarChart3, roles: ["admin"] },
];

export default function MobileNav() {
  const { user } = useAuth();
  const role = user?.role || "warehouse_staff";

  // Show up to 5 items relevant to the user's role
  const visibleItems = allNavItems
    .filter((item) => item.roles.includes(role))
    .slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex items-center justify-around py-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path + item.label}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )
              }
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
