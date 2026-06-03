import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Package, ShoppingCart, CheckCircle2, Clock,
  Search, Trash2, ArrowRight, Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import type { OrderItem } from "@/types";

interface RestockRequest {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  currentQty: number;
  minStockLevel: number;
  deficit: number;
  status: "pending" | "ordered" | "dismissed";
  requestedBy: string;
  requestedAt: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function RestockRequestsPage() {
  const { suppliers, products, addPurchaseOrder } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [createPOOpen, setCreatePOOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RestockRequest | null>(null);

  // PO creation form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [poNotes, setPONotes] = useState("");

  // Load restock requests from localStorage
  const [requests, setRequests] = useState<RestockRequest[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("stockwise-restock-requests") || "[]");
    } catch {
      return [];
    }
  });

  const filteredRequests = useMemo(() => {
    return requests
      .filter((r) =>
        statusFilter === "all" ? true : r.status === statusFilter
      )
      .filter(
        (r) =>
          search === "" ||
          r.productName.toLowerCase().includes(search.toLowerCase()) ||
          r.sku.toLowerCase().includes(search.toLowerCase()) ||
          r.requestedBy.toLowerCase().includes(search.toLowerCase())
      );
  }, [requests, search, statusFilter]);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const orderedCount = requests.filter((r) => r.status === "ordered").length;

  const openCreatePO = (req: RestockRequest) => {
    setSelectedRequest(req);
    setSelectedSupplierId(suppliers[0]?.id || "");
    setExpectedDelivery(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    );
    setOrderQty(req.deficit.toString());
    setPONotes(`Restock request from ${req.requestedBy} for ${req.productName}`);
    setCreatePOOpen(true);
  };

  const handleCreatePO = () => {
    if (!selectedRequest || !selectedSupplierId) return;
    const supplier = suppliers.find((s) => s.id === selectedSupplierId);
    if (!supplier) return;

    const prod = products.find((p) => p.id === selectedRequest.productId);
    if (!prod) {
      toast.error("Product not found in inventory.");
      return;
    }

    const qty = parseInt(orderQty) || selectedRequest.deficit;
    const unitCost = prod.costPrice || prod.unitPrice * 0.7;

    const orderItem: OrderItem = {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      quantity: qty,
      unitPrice: unitCost,
      total: qty * unitCost,
    };

    addPurchaseOrder({
      supplierId: supplier.id,
      supplierName: supplier.name,
      expectedDelivery,
      deliveryDate: expectedDelivery,
      items: [orderItem],
      notes: poNotes,
      receivedDate: undefined,
    });

    // Mark request as ordered
    const updatedRequests = requests.map((r) =>
      r.id === selectedRequest.id ? { ...r, status: "ordered" as const } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("stockwise-restock-requests", JSON.stringify(updatedRequests));

    // Notify
    const existingNotifs = JSON.parse(localStorage.getItem("stockwise-notifications") || "[]");
    const newNotif = {
      id: Math.random().toString(36).slice(2),
      title: "Restock Order Placed",
      message: `${user?.name} created a PO for "${selectedRequest.productName}" (Qty: ${qty}) via ${supplier.name}.`,
      type: "success",
      read: false,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("stockwise-notifications", JSON.stringify([newNotif, ...existingNotifs]));

    setCreatePOOpen(false);
    toast.success(`Purchase order created for "${selectedRequest.productName}".`);
  };

  const handleDismiss = (reqId: string) => {
    const updatedRequests = requests.map((r) =>
      r.id === reqId ? { ...r, status: "dismissed" as const } : r
    );
    setRequests(updatedRequests);
    localStorage.setItem("stockwise-restock-requests", JSON.stringify(updatedRequests));
    toast.info("Request dismissed.");
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Restock Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review low-stock alerts from warehouse staff and create purchase orders
          </p>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow border-amber-500/20">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <Bell className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
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
                  <p className="text-2xl font-semibold">{orderedCount}</p>
                  <p className="text-xs text-muted-foreground">Orders Placed</p>
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
                  <p className="text-2xl font-semibold">{requests.length}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
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
                  placeholder="Search by product, SKU, or staff name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                <TabsList>
                  <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                  <TabsTrigger value="ordered" className="text-xs">Ordered</TabsTrigger>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Requests List */}
      <motion.div variants={item}>
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No restock requests</p>
              <p className="text-xs text-muted-foreground mt-1">
                {statusFilter === "pending"
                  ? "No pending alerts from warehouse staff"
                  : "No requests found matching your filter"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req, idx) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className={`hover:shadow-soft-md transition-all ${
                  req.status === "pending" ? "border-amber-500/30" : ""
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${
                          req.status === "pending"
                            ? "bg-amber-500/10"
                            : req.status === "ordered"
                            ? "bg-green-500/10"
                            : "bg-muted"
                        }`}>
                          {req.status === "pending" ? (
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          ) : req.status === "ordered" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold">{req.productName}</p>
                            <Badge
                              variant={
                                req.status === "pending" ? "warning" :
                                req.status === "ordered" ? "success" : "secondary"
                              }
                              className="text-[10px] capitalize"
                            >
                              {req.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                            <span>SKU: <span className="font-medium text-foreground">{req.sku}</span></span>
                            <span>Current: <span className="font-semibold text-destructive">{req.currentQty}</span></span>
                            <span>Min: <span className="font-medium">{req.minStockLevel}</span></span>
                            <span>Deficit: <span className="font-semibold text-destructive">-{req.deficit}</span></span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1.5">
                            Requested by <span className="font-medium text-foreground">{req.requestedBy}</span> • {formatDate(req.requestedAt)}
                          </p>
                        </div>
                      </div>

                      {req.status === "pending" && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs text-muted-foreground"
                            onClick={() => handleDismiss(req.id)}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="h-8 text-xs gap-1"
                            onClick={() => openCreatePO(req)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Create PO
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Create PO Dialog */}
      <Dialog open={createPOOpen} onOpenChange={setCreatePOOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Restock Purchase Order</DialogTitle>
            <DialogDescription>
              Order stock for <span className="font-semibold text-foreground">{selectedRequest?.productName}</span> to
              replenish inventory deficit of <span className="font-semibold text-destructive">-{selectedRequest?.deficit}</span> units.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                {suppliers.filter(s => s.status === "active").map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Order Quantity</Label>
                <Input
                  type="number"
                  min="1"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                placeholder="Additional notes..."
                value={poNotes}
                onChange={(e) => setPONotes(e.target.value)}
              />
            </div>

            {selectedRequest && (
              <>
                <Separator />
                <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-medium">{selectedRequest.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Stock</span>
                    <span className="font-medium text-destructive">{selectedRequest.currentQty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Min Required</span>
                    <span className="font-medium">{selectedRequest.minStockLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Cost</span>
                    <span className="font-semibold">
                      {formatCurrency(
                        (parseInt(orderQty) || selectedRequest.deficit) *
                        (products.find(p => p.id === selectedRequest.productId)?.costPrice ||
                         (products.find(p => p.id === selectedRequest.productId)?.unitPrice || 0) * 0.7)
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePOOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePO} className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
