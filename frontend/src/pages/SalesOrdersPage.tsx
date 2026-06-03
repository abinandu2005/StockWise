import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Eye, Edit, Truck, Package as PkgIcon, ClipboardList, Trash2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import type { OrderItem } from "@/types";
import { toast } from "sonner";

const statusCfg: Record<string, { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" }> = {
  pending: { label: "Pending", variant: "secondary" },
  processing: { label: "Processing", variant: "default" },
  shipped: { label: "Shipped", variant: "warning" },
  delivered: { label: "Delivered", variant: "success" },
  returned: { label: "Returned", variant: "destructive" },
};

export default function SalesOrdersPage() {
  const { salesOrders, addSalesOrder, updateSalesOrder, deleteSalesOrder, products, updateProduct } = useData();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Single item addition state
  const [addItemProductId, setAddItemProductId] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");

  const openCreateModal = () => {
    setCustomerName("");
    setCustomerEmail("");
    setNotes("");
    setOrderItems([]);
    setAddItemProductId(products[0]?.id || "");
    setAddItemQty("1");
    setCreateOpen(true);
  };

  const handleAddOrderItem = () => {
    if (!addItemProductId) return;
    const prod = products.find(p => p.id === addItemProductId);
    if (!prod) return;

    const qty = parseInt(addItemQty) || 1;
    if (prod.quantity < qty) {
      toast.error(`Insufficient stock for ${prod.name}. Available: ${prod.quantity}`);
      return;
    }

    const exists = orderItems.find(item => item.productId === addItemProductId);

    if (exists) {
      const combinedQty = exists.quantity + qty;
      if (prod.quantity < combinedQty) {
        toast.error(`Cannot add more. Total request (${combinedQty}) exceeds active stock (${prod.quantity}).`);
        return;
      }
      setOrderItems(prev =>
        prev.map(item =>
          item.productId === addItemProductId
            ? { ...item, quantity: combinedQty, total: combinedQty * item.unitPrice }
            : item
        )
      );
    } else {
      setOrderItems(prev => [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          sku: prod.sku,
          quantity: qty,
          unitPrice: prod.unitPrice,
          total: qty * prod.unitPrice
        }
      ]);
    }
    toast.success(`Added ${prod.name} (Qty: ${qty}) to sales queue.`);
  };

  const handleRemoveOrderItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCreateOrderSubmit = () => {
    if (!customerName) {
      toast.error("Please enter a customer name.");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the sales order.");
      return;
    }

    // Double check stock availability & deduct stock
    let stockError = false;
    orderItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (!prod || prod.quantity < item.quantity) {
        toast.error(`Stock check failed for ${item.productName}. Required: ${item.quantity}, Available: ${prod?.quantity || 0}`);
        stockError = true;
      }
    });

    if (stockError) return;

    // Deduct stock immediately to reserve the allocation
    orderItems.forEach(item => {
      const prod = products.find(p => p.id === item.productId)!;
      const nextQty = prod.quantity - item.quantity;
      
      const whs = Object.keys(prod.warehouseStock);
      const targetWh = whs[0] || "Main Warehouse";
      const currentWhQty = prod.warehouseStock[targetWh] || 0;

      let nextWhQty = Math.max(0, currentWhQty - item.quantity);

      updateProduct(prod.id, {
        quantity: nextQty,
        status: nextQty <= 0 ? "out_of_stock" : nextQty <= (prod.minStockLevel || prod.minStock || 0) ? "low_stock" : "in_stock",
        warehouseStock: {
          ...prod.warehouseStock,
          [targetWh]: nextWhQty
        }
      });

      // Low stock notification
      if (nextQty <= (prod.minStockLevel || prod.minStock || 0)) {
        const existingNotifs = JSON.parse(localStorage.getItem("stockwise-notifications") || "[]");
        const newNotif = {
          id: Math.random().toString(36).slice(2),
          title: nextQty <= 0 ? "Product Out of Stock" : "Product Low Stock Alert",
          message: `Sales Dispatch reserved ${item.quantity} units of "${prod.name}". Next total: ${nextQty}.`,
          type: nextQty <= 0 ? "destructive" : "warning",
          read: false,
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem("stockwise-notifications", JSON.stringify([newNotif, ...existingNotifs]));
      }
    });

    const totalAmt = orderItems.reduce((sum, item) => sum + item.total, 0);
    const newSO = {
      orderNumber: `SO-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName,
      customerEmail: customerEmail || "guest@company.com",
      orderDate: new Date().toISOString().split("T")[0],
      items: orderItems,
      totalAmount: totalAmt,
      status: "pending" as const,
      trackingNumber: `TRK-${Math.floor(100000000 + Math.random() * 900000000)}`,
      notes,
    };

    addSalesOrder(newSO);

    // Create Audit Log
    const newLog = {
      id: Math.random().toString(36).slice(2),
      action: "Created Sale Dispatch",
      description: `${user?.name} created Sales Order ${newSO.orderNumber} for customer ${customerName}. Deducted items from active stocks.`,
      user: user?.name || "System",
      timestamp: new Date().toISOString(),
      type: "order",
    };
    const existingLogs = JSON.parse(localStorage.getItem("stockwise-activity-logs") || "[]");
    localStorage.setItem("stockwise-activity-logs", JSON.stringify([newLog, ...existingLogs]));

    toast.success(`Sales Order ${newSO.orderNumber} dispatched successfully. Stock decremented.`);
    setCreateOpen(false);
  };

  const handleMarkShipped = (id: string, orderNumber: string) => {
    const order = salesOrders.find(o => o.id === id);
    if (!order) return;

    // Deduct product quantities if order was processing/pending (stock not yet deducted for pre-existing orders)
    if (order.status === "processing" || order.status === "pending") {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          const nextQty = Math.max(0, prod.quantity - item.quantity);
          const whs = Object.keys(prod.warehouseStock);
          const targetWh = whs[0] || "Main Warehouse";
          const currentWhQty = prod.warehouseStock[targetWh] || 0;
          const nextWhQty = Math.max(0, currentWhQty - item.quantity);

          updateProduct(prod.id, {
            quantity: nextQty,
            status: nextQty <= 0 ? "out_of_stock" : nextQty <= (prod.minStockLevel || prod.minStock || 0) ? "low_stock" : "in_stock",
            warehouseStock: {
              ...prod.warehouseStock,
              [targetWh]: nextWhQty
            }
          });
        }
      });
    }

    updateSalesOrder(id, { status: "shipped", shippedDate: new Date().toISOString().split("T")[0] });
    toast.success(`Sales Order ${orderNumber} is now marked as SHIPPED. Stock quantities updated.`);
  };

  const handleMarkDelivered = (id: string, orderNumber: string) => {
    updateSalesOrder(id, { status: "delivered", deliveredDate: new Date().toISOString().split("T")[0] });
    toast.success(`Sales Order ${orderNumber} marked as DELIVERED.`);
  };

  const filtered = salesOrders.filter((o) => {
    const s = o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    return s && (statusF === "all" || o.status === statusF);
  });

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sales & Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer sales orders and outbound shipments</p>
        </div>
        <Button size="sm" onClick={openCreateModal} className={(user?.role === "warehouse_staff") ? "hidden" : ""}>
          <Plus className="mr-2 h-4 w-4" />New Sale
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Sales", value: salesOrders.length, icon: ClipboardList },
          { label: "Pending Reserve", value: salesOrders.filter(o => o.status === "pending" || o.status === "processing").length, icon: PkgIcon },
          { label: "Shipped Outflows", value: salesOrders.filter(o => o.status === "shipped").length, icon: Truck },
          { label: "Revenue generated", value: formatCurrency(salesOrders.reduce((a, o) => a + o.totalAmount, 0)), icon: ClipboardList },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search sales by customer or number..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={statusF} onValueChange={setStatusF}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                <TabsTrigger value="shipped" className="text-xs">Shipped</TabsTrigger>
                <TabsTrigger value="delivered" className="text-xs">Delivered</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Order</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Customer</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Date</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total Amount</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o, i) => (
                <motion.tr
                  key={o.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">{o.customerName}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-sm">{o.customerName}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{formatDate(o.orderDate)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusCfg[o.status]?.variant} className="text-[10px] uppercase">
                      {statusCfg[o.status]?.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewOrder(o)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(o.status === "pending" || o.status === "processing") && (
                          <DropdownMenuItem onClick={() => handleMarkShipped(o.id, o.orderNumber)}>
                            <Truck className="mr-2 h-4 w-4" />
                            Mark Shipped
                          </DropdownMenuItem>
                        )}
                        {o.status === "shipped" && (
                          <DropdownMenuItem onClick={() => handleMarkDelivered(o.id, o.orderNumber)}>
                            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                            Mark Delivered
                          </DropdownMenuItem>
                        )}
                        {user?.role !== "warehouse_staff" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Remove and cancel sales order ${o.orderNumber}?`)) {
                                deleteSalesOrder(o.id);
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Dispatch
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No sales orders found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>{viewOrder.orderNumber}</DialogTitle>
                <DialogDescription>Customer: {viewOrder.customerName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
                  <div>
                    <p className="text-xs text-muted-foreground font-normal">Status</p>
                    <Badge variant={statusCfg[viewOrder.status]?.variant} className="mt-1 uppercase">
                      {statusCfg[viewOrder.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-normal">Total Bill</p>
                    <p className="font-semibold text-sm mt-1">{formatCurrency(viewOrder.totalAmount)}</p>
                  </div>
                </div>
                {viewOrder.trackingNumber && (
                  <div className="text-sm bg-muted/50 p-2 rounded">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Tracking ID</p>
                    <p className="font-mono text-xs">{viewOrder.trackingNumber}</p>
                  </div>
                )}
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Unit Price</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items.map((it: any) => (
                        <tr key={it.productId} className="border-b last:border-0">
                          <td className="px-3 py-2">{it.productName}</td>
                          <td className="px-3 py-2 text-right">{it.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(it.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(it.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Sales Order Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Outbound Sales Order</DialogTitle>
            <DialogDescription>Deduct stock items immediately to dispatch goods to customers.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cust-name">Customer Name*</Label>
                <Input
                  id="cust-name"
                  placeholder="e.g. Acme Corp"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cust-email">Contact Email</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="contact@acme.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales-notes">Shipping Notes/Remarks</Label>
              <Input
                id="sales-notes"
                placeholder="Shipping instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Separator />

            {/* Selecting item and quantity to add */}
            <div className="space-y-3">
              <Label>Select Products to Dispatch</Label>
              <div className="flex gap-2">
                <select
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={addItemProductId}
                  onChange={(e) => setAddItemProductId(e.target.value)}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Avail: {p.quantity})
                    </option>
                  ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  className="w-20"
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(e.target.value)}
                />
                <Button type="button" variant="secondary" onClick={handleAddOrderItem}>
                  Add
                </Button>
              </div>
            </div>

            {/* Added queue list */}
            <div className="rounded-md border p-2 bg-muted/20 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold mb-2">Dispatched Items Queue:</p>
              {orderItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-xs border-b last:border-0 py-1.5">
                  <div>
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{formatCurrency(item.total)}</span>
                    <button
                      type="button"
                      className="text-destructive font-semibold hover:underline"
                      onClick={() => handleRemoveOrderItem(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              {orderItems.length === 0 && (
                <p className="text-xs text-muted-foreground italic text-center py-2">No items selected yet.</p>
              )}
            </div>

            {orderItems.length > 0 && (
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total Amount:</span>
                <span>{formatCurrency(orderItems.reduce((sum, item) => sum + item.total, 0))}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrderSubmit}>Create Order & Dispatch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
