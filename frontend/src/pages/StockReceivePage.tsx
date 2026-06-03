import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Package, Truck, Calendar, CheckCircle2, Clock, Search,
  ChevronDown, ChevronUp, AlertTriangle, PackageCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency } from "@/lib/utils";
import type { PurchaseOrder } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function StockReceivePage() {
  const { purchaseOrders, receivePurchaseOrder } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<PurchaseOrder | null>(null);

  // Only show orders that are incoming (sent or partially_received)
  const incomingOrders = useMemo(() => {
    return purchaseOrders.filter(
      (o) =>
        (o.status === "sent" || o.status === "partially_received") &&
        (search === "" ||
          o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
          o.supplierName.toLowerCase().includes(search.toLowerCase()))
    );
  }, [purchaseOrders, search]);

  // Recently completed orders (last 5)
  const recentlyReceived = useMemo(() => {
    return purchaseOrders
      .filter((o) => o.status === "completed")
      .sort((a, b) => (b.receivedDate || b.orderDate).localeCompare(a.receivedDate || a.orderDate))
      .slice(0, 5);
  }, [purchaseOrders]);

  const handleReceive = () => {
    if (!confirmOrder) return;
    receivePurchaseOrder(confirmOrder.id);
    setConfirmOrder(null);
  };

  const totalIncomingItems = useMemo(() => {
    return incomingOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
  }, [incomingOrders]);

  const totalIncomingValue = useMemo(() => {
    return incomingOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  }, [incomingOrders]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {user?.role === "purchase_manager" ? "Upcoming Shipments" : "Stock Receive"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {user?.role === "purchase_manager"
              ? "Track incoming purchase order shipments and delivery timelines"
              : "Receive incoming purchase order shipments into inventory"}
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{incomingOrders.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Shipments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalIncomingItems.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Items Expected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{formatCurrency(totalIncomingValue)}</p>
                  <p className="text-xs text-muted-foreground">Total Incoming Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div variants={item}>
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by PO number or supplier name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Incoming Orders */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-amber-500" />
          Incoming Shipments
        </h2>
        {incomingOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <PackageCheck className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No incoming shipments at this time</p>
              <p className="text-xs text-muted-foreground mt-1">All purchase orders have been received</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {incomingOrders.map((order) => {
              const isExpanded = expandedId === order.id;
              const isOverdue = order.expectedDelivery && new Date(order.expectedDelivery) < new Date();
              return (
                <Card key={order.id} className="hover:shadow-soft-md transition-all">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          order.status === "partially_received"
                            ? "bg-amber-500/10"
                            : "bg-primary/10"
                        }`}>
                          <Truck className={`h-5 w-5 ${
                            order.status === "partially_received"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-primary"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{order.orderNumber}</p>
                            <Badge
                              variant={order.status === "partially_received" ? "warning" : "secondary"}
                              className="text-[10px] capitalize"
                            >
                              {order.status.replace(/_/g, " ")}
                            </Badge>
                            {isOverdue && (
                              <Badge variant="destructive" className="text-[10px]">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Overdue
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            From: <span className="font-medium text-foreground">{order.supplierName}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            Expected: {order.expectedDelivery || "N/A"}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t"
                      >
                        <div className="p-4 space-y-3">
                          {/* Items Table */}
                          <div className="rounded-lg border overflow-hidden">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-muted/50">
                                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Product</th>
                                  <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden sm:table-cell">SKU</th>
                                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Qty</th>
                                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Unit Price</th>
                                  <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((itm, idx) => (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2 text-sm">{itm.productName}</td>
                                    <td className="px-3 py-2 hidden sm:table-cell">
                                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{itm.sku}</code>
                                    </td>
                                    <td className="px-3 py-2 text-right text-sm font-medium">{itm.quantity}</td>
                                    <td className="px-3 py-2 text-right text-sm">{formatCurrency(itm.unitPrice)}</td>
                                    <td className="px-3 py-2 text-right text-sm font-medium">{formatCurrency(itm.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {order.notes && (
                            <p className="text-xs text-muted-foreground italic">
                              Note: {order.notes}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <p className="text-xs text-muted-foreground">
                              Created by: <span className="font-medium">{order.createdBy}</span>
                            </p>
                            {user?.role !== "purchase_manager" && (
                              <Button
                                size="sm"
                                onClick={() => setConfirmOrder(order)}
                                className="gap-2"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Mark as Received
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Recently Received */}
      {recentlyReceived.length > 0 && (
        <motion.div variants={item}>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recently Received
          </h2>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">PO Number</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Supplier</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Items</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentlyReceived.map((order) => (
                    <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Received: {order.receivedDate?.split("T")[0] || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{order.supplierName}</td>
                      <td className="px-4 py-3 text-right text-sm hidden sm:table-cell">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} units
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="success" className="text-[10px]">Completed</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmOrder} onOpenChange={() => setConfirmOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Shipment Received</DialogTitle>
            <DialogDescription>
              You are about to mark <span className="font-semibold text-foreground">{confirmOrder?.orderNumber}</span>{" "}
              from <span className="font-semibold text-foreground">{confirmOrder?.supplierName}</span> as fully received.
            </DialogDescription>
          </DialogHeader>
          {confirmOrder && (
            <div className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">The following items will be added to inventory:</p>
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                {confirmOrder.items.map((itm, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span>{itm.productName}</span>
                    <span className="font-medium text-green-600 dark:text-green-400">+{itm.quantity} units</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total Value</span>
                <span>{formatCurrency(confirmOrder.totalAmount)}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleReceive} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirm Received
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
