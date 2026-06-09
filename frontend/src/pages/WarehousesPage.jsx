import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Warehouse as WIcon, MapPin, Users, Package, MoreHorizontal, Edit, Trash2, ShieldAlert, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function WarehousesPage() {
  const { warehouses, addWarehouse, updateWarehouse, deleteWarehouse, products, fetchWarehouses, fetchProducts, updateProduct } = useData();

  useEffect(() => {
    fetchWarehouses();
    fetchProducts();
  }, [fetchWarehouses, fetchProducts]);
  const { user } = useAuth();

  const [addOpen, setAddOpen] = useState(false);
  const [editWh, setEditWh] = useState(null);
  const [expandedWhId, setExpandedWhId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [whToDelete, setWhToDelete] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("10000");
  const [manager, setManager] = useState("");
  const [status, setStatus] = useState("active");

  const openAddModal = () => {
    setName("");
    setLocation("");
    setCapacity("10000");
    setManager("");
    setStatus("active");
    setAddOpen(true);
  };

  const openEditModal = (wh) => {
    setEditWh(wh);
    setName(wh.name);
    setLocation(wh.location);
    setCapacity(wh.capacity.toString());
    setManager(wh.manager);
    setStatus(wh.status);
  };

  const handleAddSubmit = () => {
    if (!name || !location || !manager) {
      toast.error("Please fill in warehouse name, location, and manager.");
      return;
    }

    addWarehouse({
      name,
      location,
      capacity: parseInt(capacity) || 10000,
      manager,
      status,
    });

    setAddOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editWh) return;
    if (!name || !location || !manager) {
      toast.error("Please fill in warehouse name, location, and manager.");
      return;
    }

    updateWarehouse(editWh.id, {
      name,
      location,
      capacity: parseInt(capacity) || 10000,
      manager,
      status,
    });
    setEditWh(null);
  };

  // Helper products and stats for a warehouse — matches by warehouse ID or name
  const getWarehouseProducts = (wh) => {
    const results = [];
    products.forEach((p) => {
      // Check by both wh.id and wh.name since products may use either as key
      const qtyById = p.warehouseStock[wh.id] || 0;
      const qtyByName = p.warehouseStock[wh.name] || 0;
      const qtyInWh = qtyById + qtyByName;
      if (qtyInWh > 0) {
        results.push({ product: p, qtyInWh });
      }
    });
    return results;
  };

  // Helper to compute active statistics for each warehouse dynamically based on products distribution!
  const getWarehouseStats = (wh) => {
    let totalQty = 0;
    let totalValuation = 0;

    products.forEach((p) => {
      const qtyById = p.warehouseStock[wh.id] || 0;
      const qtyByName = p.warehouseStock[wh.name] || 0;
      const qtyInWh = qtyById + qtyByName;
      totalQty += qtyInWh;
      totalValuation += qtyInWh * p.unitPrice;
    });

    return { totalQty, totalValuation };
  };

  // Calculate global statistics across all warehouses
  const globalStats = warehouses.reduce(
    (acc, wh) => {
      const stats = getWarehouseStats(wh);
      return {
        totalStock: acc.totalStock + stats.totalQty,
        totalValuation: acc.totalValuation + stats.totalValuation,
        totalCapacity: acc.totalCapacity + wh.capacity,
      };
    },
    { totalStock: 0, totalValuation: 0, totalCapacity: 0 }
  );

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [prodToMove, setProdToMove] = useState(null);
  const [moveFromWh, setMoveFromWh] = useState(null);
  const [moveToWhId, setMoveToWhId] = useState("");
  const [moveQty, setMoveQty] = useState("");

  const handleMoveProduct = () => {
    if (!prodToMove || !moveFromWh || !moveToWhId || !moveQty) {
      toast.error("Please fill all move fields.");
      return;
    }
    const qty = parseInt(moveQty) || 0;
    if (qty <= 0) { toast.error("Move qty must be > 0."); return; }

    const toWh = warehouses.find(w => w.id === moveToWhId);
    if (!toWh) return;

    const fromQty = prodToMove.warehouseStock?.[moveFromWh.name] || 0;
    if (qty > fromQty) {
      toast.error(`Only ${fromQty} units available in ${moveFromWh.name}.`);
      return;
    }

    const newWhStock = { ...(prodToMove.warehouseStock || {}) };
    newWhStock[moveFromWh.name] = fromQty - qty;
    newWhStock[toWh.name] = (newWhStock[toWh.name] || 0) + qty;

    updateProduct(prodToMove.id, {
      warehouseStock: newWhStock,
      warehouseId: toWh.id,
    });

    toast.success(`Moved ${qty} units of "${prodToMove.name}" → ${toWh.name}`);
    setMoveDialogOpen(false);
    setProdToMove(null);
    setMoveQty("");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Warehouses</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage warehouse locations, capacity distributions, and valuations</p>
        </div>
        {user?.role === "admin" && (
          <Button size="sm" onClick={openAddModal}>
            <WIcon className="mr-2 h-4 w-4" />
            Add Warehouse
          </Button>
        )}
      </div>

      {/* Admin specific totals panel */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Network Inventory Quantity</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">
              {formatNumber(globalStats.totalStock)} units
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Total Inventory Asset Valuation</p>
            <p className="text-2xl font-semibold mt-1 text-primary">
              {formatCurrency(globalStats.totalValuation)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground font-medium">Network Storage Fill Rate</p>
            <p className="text-2xl font-semibold mt-1 text-foreground">
              {globalStats.totalCapacity > 0
                ? `${Math.round((globalStats.totalStock / globalStats.totalCapacity) * 100)}%`
                : "0%"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((wh, idx) => {
          const { totalQty, totalValuation } = getWarehouseStats(wh);
          const usage = wh.capacity > 0 ? (totalQty / wh.capacity) * 100 : 0;
          const isExpanded = expandedWhId === wh.id;
          const whProducts = isExpanded ? getWarehouseProducts(wh) : [];

          return (
            <motion.div
              key={wh.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={isExpanded ? "sm:col-span-2 lg:col-span-3" : ""}
            >
              <Card className="hover:shadow-soft-md transition-shadow h-full">
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                          <WIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{wh.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {wh.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={wh.status === "active" ? "success" : "secondary"} className="text-[10px] uppercase">
                          {wh.status}
                        </Badge>
                        {user?.role === "admin" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(wh)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Warehouse
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  setWhToDelete(wh);
                                  setDeleteConfirmOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Location
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {formatNumber(totalQty)} / {formatNumber(wh.capacity)} capacity
                        </span>
                        <span>{Math.round(usage)}%</span>
                      </div>
                      <Progress value={Math.min(100, usage)} className="h-2" />
                    </div>
                  </div>

                  <div className="pt-2 border-t mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Total Value:</span>
                      <span className="font-semibold text-foreground">{formatCurrency(totalValuation)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Warehouse Manager:</span>
                      <span className="font-medium text-foreground">{wh.manager}</span>
                    </div>
                  </div>

                  {/* View Products Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-xs gap-2"
                    onClick={() => setExpandedWhId(isExpanded ? null : wh.id)}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {isExpanded ? "Hide Products" : `View Products (${getWarehouseProducts(wh).length})`}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </Button>

                  {/* Expanded Products Table */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="rounded-lg border mt-2 overflow-hidden">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/50">
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2">Product</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden sm:table-cell">SKU</th>
                                <th className="text-left text-xs font-medium text-muted-foreground px-3 py-2 hidden md:table-cell">Category</th>
                                <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Qty in WH</th>
                                <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2">Unit Price</th>
                                <th className="text-right text-xs font-medium text-muted-foreground px-3 py-2 hidden sm:table-cell">Value</th>
                                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Status</th>
                                <th className="text-center text-xs font-medium text-muted-foreground px-3 py-2">Move</th>
                              </tr>
                            </thead>
                            <tbody>
                              {whProducts.map(({ product: p, qtyInWh }) => (
                                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors">
                                  <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-7 w-7 items-center justify-center rounded bg-muted shrink-0">
                                        <Package className="h-3.5 w-3.5 text-muted-foreground" />
                                      </div>
                                      <span className="text-sm font-medium truncate max-w-[160px]">{p.name}</span>
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 hidden sm:table-cell">
                                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku}</code>
                                  </td>
                                  <td className="px-3 py-2 hidden md:table-cell text-xs text-muted-foreground">{p.category}</td>
                                  <td className="px-3 py-2 text-right text-sm font-semibold">{qtyInWh}</td>
                                  <td className="px-3 py-2 text-right text-sm">{formatCurrency(p.unitPrice)}</td>
                                  <td className="px-3 py-2 text-right text-sm font-medium hidden sm:table-cell">
                                    {formatCurrency(qtyInWh * p.unitPrice)}
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Badge
                                      variant={p.status === "in_stock" ? "success" : p.status === "low_stock" ? "warning" : "destructive"}
                                      className="text-[10px]"
                                    >
                                      {p.status === "in_stock" ? "In Stock" : p.status === "low_stock" ? "Low" : "Out"}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      title="Move to another warehouse"
                                      onClick={() => {
                                        setProdToMove(p);
                                        setMoveFromWh(wh);
                                        setMoveToWhId(warehouses.find(w => w.id !== wh.id)?.id || "");
                                        setMoveQty("");
                                        setMoveDialogOpen(true);
                                      }}
                                    >
                                      <WIcon className="h-3.5 w-3.5" />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                              {whProducts.length === 0 && (
                                <tr>
                                  <td colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
                                    No products stored in this warehouse
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
        {warehouses.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 text-center py-12">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground/60 mb-2" />
            <p className="text-sm text-muted-foreground">No warehouses set up. Click Add Warehouse to configure.</p>
          </div>
        )}
      </div>

      {/* Move Product Dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Product to Another Warehouse</DialogTitle>
            <DialogDescription>
              Transfer stock of <span className="font-semibold text-foreground">{prodToMove?.name}</span> from{" "}
              <span className="font-semibold text-foreground">{moveFromWh?.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Destination Warehouse</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={moveToWhId}
                onChange={(e) => setMoveToWhId(e.target.value)}
              >
                {warehouses.filter(w => w.id !== moveFromWh?.id).map(w => (
                  <option key={w.id} value={w.id}>{w.name} — {w.location || ""}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>
                Quantity to Move{" "}
                <span className="text-muted-foreground text-xs">
                  (Available: {prodToMove?.warehouseStock?.[moveFromWh?.name] || 0} units)
                </span>
              </Label>
              <Input
                type="number"
                min="1"
                max={prodToMove?.warehouseStock?.[moveFromWh?.name] || 0}
                value={moveQty}
                onChange={(e) => setMoveQty(e.target.value)}
                placeholder="Units to move..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMoveProduct}>Move Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Warehouse Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Warehouse Location</DialogTitle>
            <DialogDescription>Create a new stock keeping facility.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="wh-name">Warehouse Name*</Label>
              <Input placeholder="e.g. North Side Hub" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-location">Location Address*</Label>
              <Input placeholder="e.g. Chicago, IL" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="wh-capacity">Maximum Capacity (units)*</Label>
                <Input type="number" placeholder="10000" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wh-manager">Warehouse Manager Name*</Label>
                <Input placeholder="e.g. Dave Miller" value={manager} onChange={(e) => setManager(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wh-status">Operational Status</Label>
              <select
                id="wh-status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit}>Create Location</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Warehouse Modal */}
      <Dialog open={!!editWh} onOpenChange={() => setEditWh(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Warehouse Details</DialogTitle>
            <DialogDescription>Modify fields and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-wh-name">Warehouse Name*</Label>
              <Input placeholder="e.g. North Side Hub" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wh-location">Location Address*</Label>
              <Input placeholder="e.g. Chicago, IL" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-wh-capacity">Maximum Capacity (units)*</Label>
                <Input type="number" placeholder="10000" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-wh-manager">Warehouse Manager Name*</Label>
                <Input placeholder="e.g. Dave Miller" value={manager} onChange={(e) => setManager(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wh-status">Operational Status</Label>
              <select
                id="edit-wh-status"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWh(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Warehouse Location</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete warehouse <span className="font-semibold text-foreground">{whToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Keep Location
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (whToDelete) {
                  deleteWarehouse(whToDelete.id);
                  setDeleteConfirmOpen(false);
                  setWhToDelete(null);
                }
              }}
            >
              Yes, Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
