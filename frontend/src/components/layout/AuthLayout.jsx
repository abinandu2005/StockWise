import { Outlet } from "react-router-dom";
import { Package } from "lucide-react";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-transparent overflow-hidden">
              <img src="/logo.png" alt="StockWise Logo" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">StockWise</h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Professional inventory management for modern warehouses and retail chains.
            Track stock, manage orders, and optimize your supply chain — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              { value: "10K+", label: "Products Tracked" },
              { value: "99.9%", label: "Uptime" },
              { value: "500+", label: "Warehouses" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border bg-background p-4">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-transparent overflow-hidden">
              <img src="/logo.png" alt="StockWise Logo" className="h-9 w-9 object-contain" />
            </div>
            <span className="text-xl font-semibold">StockWise</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
