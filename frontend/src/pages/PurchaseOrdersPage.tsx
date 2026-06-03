import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, Eye, Edit, FileText, Send, ChevronRight, ShoppingCart, Trash2, CheckCircle2 } from "lucide-react";
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
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Sent", variant: "default" },
  partially_received: { label: "Partial", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function PurchaseOrdersPage() {
  const { purchaseOrders, addPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder, suppliers, products, updateProduct } = useData();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [statusF, setStatusF] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<any | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  
  // Adding single item state
  const [addItemProductId, setAddItemProductId] = useState("");
  const [addItemQty, setAddItemQty] = useState("1");

  const openCreateModal = () => {
    setSelectedSupplierId(suppliers[0]?.id || "");
    setExpectedDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
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
    const exists = orderItems.find(item => item.productId === addItemProductId);

    if (exists) {
      setOrderItems(prev =>
        prev.map(item =>
          item.productId === addItemProductId
            ? { ...item, quantity: item.quantity + qty, total: (item.quantity + qty) * item.unitPrice }
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
          unitPrice: prod.costPrice || prod.unitPrice * 0.7, // Cost price default, fallback to 70% of price
          total: qty * (prod.costPrice || prod.unitPrice * 0.7)
        }
      ]);
    }
    toast.success(`Added ${prod.name} to order list.`);
  };

  const handleRemoveOrderItem = (productId: string) => {
    setOrderItems(prev => prev.filter(item => item.productId !== productId));
  };

  const handleCreateOrderSubmit = () => {
    if (!selectedSupplierId) {
      toast.error("Please select a supplier.");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the purchase order.");
      return;
    }

    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    if (!supplier) return;

    const totalAmt = orderItems.reduce((sum, item) => sum + item.total, 0);

    const newPO = {
      orderNumber: `PO-${Math.floor(100000 + Math.random() * 900000)}`,
      supplierId: supplier.id,
      supplierName: supplier.name,
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery: expectedDeliveryDate,
      deliveryDate: expectedDeliveryDate,
      items: orderItems,
      totalAmount: totalAmt,
      status: "draft" as const,
      notes,
    };

    addPurchaseOrder(newPO);

    // Create Audit Log
    const newLog = {
      id: Math.random().toString(36).slice(2),
      action: "Created PO",
      description: `${user?.name} created Purchase Order ${newPO.orderNumber} for supplier ${supplier.name}.`,
      user: user?.name || "System",
      timestamp: new Date().toISOString(),
      type: "order",
    };
    const existingLogs = JSON.parse(localStorage.getItem("stockwise-activity-logs") || "[]");
    localStorage.setItem("stockwise-activity-logs", JSON.stringify([newLog, ...existingLogs]));

    setCreateOpen(false);
  };

  const handleMarkSent = (id: string, orderNumber: string) => {
    updatePurchaseOrder(id, { status: "sent" });
    toast.success(`Purchase Order ${orderNumber} marked as SENT.`);
  };

  const handleMarkCompleted = (id: string) => {
    const po = purchaseOrders.find(o => o.id === id);
    if (!po) return;

    // 1. Update quantities in active inventory
    po.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const nextQty = prod.quantity + item.quantity;
        const mainWh = Object.keys(prod.warehouseStock)[0] || "Main Warehouse";
        const currentWhQty = prod.warehouseStock[mainWh] || 0;
        
        // Update product state
        updateProduct(prod.id, {
          quantity: nextQty,
          status: nextQty > (prod.minStockLevel || prod.minStock || 0) ? "in_stock" : "low_stock",
          warehouseStock: {
            ...prod.warehouseStock,
            [mainWh]: currentWhQty + item.quantity
          }
        });
      }
    });

    // 2. Mark PO as Completed
    updatePurchaseOrder(id, { status: "completed" });

    // 3. Create Audit Log
    const newLog = {
      id: Math.random().toString(36).slice(2),
      action: "Completed PO",
      description: `Purchase Order ${po.orderNumber} completed. Added order quantities directly to active inventory.`,
      user: user?.name || "System",
      timestamp: new Date().toISOString(),
      type: "order",
    };
    const existingLogs = JSON.parse(localStorage.getItem("stockwise-activity-logs") || "[]");
    localStorage.setItem("stockwise-activity-logs", JSON.stringify([newLog, ...existingLogs]));

    // 4. Trigger Success Notification
    const existingNotifs = JSON.parse(localStorage.getItem("stockwise-notifications") || "[]");
    const newNotif = {
      id: Math.random().toString(36).slice(2),
      title: "Purchase Order Completed",
      message: `Purchase Order ${po.orderNumber} items successfully received and added to inventory.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("stockwise-notifications", JSON.stringify([newNotif, ...existingNotifs]));

    toast.success(`Purchase Order ${po.orderNumber} completed. Active inventory stock counts updated!`);
  };

  const filtered = purchaseOrders.filter((o) => {
    const s = o.orderNumber.toLowerCase().includes(search.toLowerCase()) || o.supplierName.toLowerCase().includes(search.toLowerCase());
    return s && (statusF === "all" || o.status === statusF);
  });

  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(o => o.status === "draft").length,
    pending: purchaseOrders.filter(o => o.status === "sent" || o.status === "partially_received").length,
    completed: purchaseOrders.filter(o => o.status === "completed").length,
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage supplier purchase orders and stock arrivals</p>
        </div>
        <Button size="sm" onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" />New Order</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Orders", value: stats.total, color: "text-foreground" },
          { label: "Drafts", value: stats.draft, color: "text-muted-foreground" },
          { label: "Pending Sent", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "Completed Inflows", value: stats.completed, color: "text-green-600 dark:text-green-400" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-semibold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders by number or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={statusF} onValueChange={setStatusF}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="draft" className="text-xs">Draft</TabsTrigger>
                <TabsTrigger value="sent" className="text-xs">Sent</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {filtered.map((order, idx) => (
          <motion.div key={order.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
            <Card className="hover:shadow-soft-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <Badge variant={statusCfg[order.status]?.variant || "secondary"} className="text-[10px] uppercase">
                          {statusCfg[order.status]?.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{order.supplierName}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{order.items.length} items</span>
                        <span>Placed: {formatDate(order.orderDate)}</span>
                        <span>Deliv: {formatDate(order.expectedDelivery || order.deliveryDate || "")}</span>
                        <span className="font-semibold text-foreground">{formatCurrency(order.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewOrder(order)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {order.status === "draft" && (
                        <DropdownMenuItem onClick={() => handleMarkSent(order.id, order.orderNumber)}>
                          <Send className="mr-2 h-4 w-4" />
                          Mark as Sent
                        </DropdownMenuItem>
                      )}
                      {order.status === "sent" && (
                        <DropdownMenuItem onClick={() => handleMarkCompleted(order.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                          Mark Completed (Receive)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => {
                          if (confirm(`Cancel and delete order ${order.orderNumber}?`)) {
                            deletePurchaseOrder(order.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No purchase orders found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* View Order Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewOrder && (
            <>
              <DialogHeader>
                <DialogTitle>{viewOrder.orderNumber}</DialogTitle>
                <DialogDescription>Supplier: {viewOrder.supplierName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4 text-sm font-medium">
                  <div>
                    <p className="text-xs text-muted-foreground font-normal">Status</p>
                    <Badge variant={statusCfg[viewOrder.status]?.variant} className="mt-1 uppercase">
                      {statusCfg[viewOrder.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-normal">Total Amount</p>
                    <p className="font-semibold mt-1 text-sm">{formatCurrency(viewOrder.totalAmount)}</p>
                  </div>
                </div>
                <div className="rounded-lg border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Item Name</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Qty</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Unit Cost</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viewOrder.items.map((item: any) => (
                        <tr key={item.productId} className="border-b last:border-0">
                          <td className="px-3 py-2">{item.productName}</td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-3 py-2 text-right font-medium">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {viewOrder.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notes</p>
                    <p className="text-xs mt-1 bg-muted p-2 rounded leading-relaxed">{viewOrder.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Draft a new order request to be sent to a supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="supplier-select">Supplier Partners*</Label>
              <select
                id="supplier-select"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Expected Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Notes/Priority</Label>
                <Input
                  id="priority"
                  placeholder="e.g. Rush / Standard"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <Separator />

            {/* Adding products */}
            <div className="space-y-3">
              <Label>Add Products to Order</Label>
              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <select
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring truncate"
                    value={addItemProductId}
                    onChange={(e) => setAddItemProductId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku})
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  type="number"
                  min="1"
                  className="w-20 h-9 shrink-0"
                  value={addItemQty}
                  onChange={(e) => setAddItemQty(e.target.value)}
                />
                <Button type="button" variant="secondary" size="sm" className="h-9 shrink-0" onClick={handleAddOrderItem}>
                  Add
                </Button>
              </div>
            </div>

            {/* Selected Items Grid */}
            <div className="rounded-md border p-2 bg-muted/20 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold mb-2">Order Items Queue:</p>
              {orderItems.map((item) => (
                <div key={item.productId} className="flex justify-between items-center text-xs border-b last:border-0 py-1.5">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="font-medium truncate">{item.productName}</p>
                    <span className="text-[10px] text-muted-foreground">Qty: {item.quantity}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
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
                <p className="text-xs text-muted-foreground italic text-center py-2">No items added to order yet.</p>
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
            <Button onClick={handleCreateOrderSubmit}>Create Order Draft</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
