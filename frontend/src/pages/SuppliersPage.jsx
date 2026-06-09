import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Star, Phone, Mail, MapPin, MoreHorizontal, Eye, Edit, Trash2, Truck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";

const tierColors = {
  standard: "bg-secondary text-secondary-foreground",
  premium: "bg-primary/10 text-primary",
  enterprise: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
};

export default function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, fetchSuppliers, purchaseOrders, fetchPurchaseOrders } = useData();

  useEffect(() => {
    fetchSuppliers();
    fetchPurchaseOrders();
  }, [fetchSuppliers, fetchPurchaseOrders]);

  // Compute real stats per supplier from purchase orders
  const supplierStats = useMemo(() => {
    const statsMap = {};
    suppliers.forEach(sup => {
      const supPOs = purchaseOrders.filter(po =>
        po.supplierId === sup.id || po.supplierName === sup.name
      );
      statsMap[sup.id] = {
        totalOrders: supPOs.length,
        totalSpent: supPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0),
      };
    });
    return statsMap;
  }, [suppliers, purchaseOrders]);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [viewSup, setViewSup] = useState(null);
  const [editSup, setEditSup] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [supToDelete, setSupToDelete] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pricingTier, setPricingTier] = useState("standard");
  const [rating, setRating] = useState("5.0");
  const [status, setStatus] = useState("active");

  const openAddModal = () => {
    setName("");
    setContactPerson("");
    setEmail("");
    setPhone("");
    setAddress("");
    setPricingTier("standard");
    setRating("5.0");
    setStatus("active");
    setAddOpen(true);
  };

  const openEditModal = (s) => {
    setEditSup(s);
    setName(s.name);
    setContactPerson(s.contactPerson);
    setEmail(s.email);
    setPhone(s.phone);
    setAddress(s.address);
    setPricingTier(s.pricingTier);
    setRating(s.rating.toString());
    setStatus(s.status);
  };

  const handleAddSubmit = () => {
    if (!name || !contactPerson || !email) {
      toast.error("Please fill in company name, contact person, and email.");
      return;
    }

    addSupplier({
      name,
      contactPerson,
      email,
      phone: phone || "+1 555-0100",
      address: address || "No address provided",
      pricingTier,
      rating: parseFloat(rating) || 5.0,
      status,
    });
    setAddOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editSup) return;
    if (!name || !contactPerson || !email) {
      toast.error("Please fill in company name, contact person, and email.");
      return;
    }

    updateSupplier(editSup.id, {
      name,
      contactPerson,
      email,
      phone,
      address,
      pricingTier,
      rating: parseFloat(rating) || 5.0,
      status,
    });
    setEditSup(null);
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your supplier network</p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers by name or contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((sup, idx) => (
          <motion.div
            key={sup.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Card className="hover:shadow-soft-md transition-shadow h-full flex flex-col justify-between">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                        {sup.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{sup.name}</p>
                        <p className="text-xs text-muted-foreground">{sup.contactPerson}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewSup(sup)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(sup)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Supplier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setSupToDelete(sup);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {sup.email}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      {sup.phone}
                    </div>
                  </div>
                </div>

                <div>
                  <Separator className="my-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium">{sup.rating}</span>
                    </div>
                    <Badge className={`text-[10px] uppercase ${tierColors[sup.pricingTier] || ""}`}>
                      {sup.pricingTier}
                    </Badge>
                    <Badge variant={sup.status === "active" ? "success" : "secondary"} className="text-[10px] uppercase">
                      {sup.status}
                    </Badge>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Orders</p>
                      <p className="text-sm font-semibold">{supplierStats[sup.id]?.totalOrders ?? 0}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-sm font-semibold">{formatCurrency(supplierStats[sup.id]?.totalSpent ?? 0)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No suppliers found</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* View Supplier Modal */}
      <Dialog open={!!viewSup} onOpenChange={() => setViewSup(null)}>
        <DialogContent>
          {viewSup && (
            <>
              <DialogHeader>
                <DialogTitle>{viewSup.name}</DialogTitle>
                <DialogDescription>
                  {viewSup.contactPerson} · {viewSup.pricingTier} tier
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {viewSup.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {viewSup.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {viewSup.address}
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span className="font-medium">{viewSup.rating}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-medium mt-1">{supplierStats[viewSup.id]?.totalOrders ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Spent</p>
                    <p className="font-medium mt-1">{formatCurrency(supplierStats[viewSup.id]?.totalSpent ?? 0)}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Supplier Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>Create a new supplier partner profile.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name*</Label>
                <Input placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Person*</Label>
                <Input placeholder="Full name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email*</Label>
                <Input type="email" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pricingTier}
                  onChange={(e) => setPricingTier(e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input type="number" min="1" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Modal */}
      <Dialog open={!!editSup} onOpenChange={() => setEditSup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Supplier Details</DialogTitle>
            <DialogDescription>Modify fields and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name*</Label>
                <Input placeholder="Supplier name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact Person*</Label>
                <Input placeholder="Full name" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email*</Label>
                <Input type="email" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 555-0100" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input placeholder="Full address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Pricing Tier</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pricingTier}
                  onChange={(e) => setPricingTier(e.target.value)}
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input type="number" min="1" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSup(null)}>
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
            <DialogTitle>Remove Supplier</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove supplier <span className="font-semibold text-foreground">{supToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Keep Supplier
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (supToDelete) {
                  deleteSupplier(supToDelete.id);
                  setDeleteConfirmOpen(false);
                  setSupToDelete(null);
                }
              }}
            >
              Yes, Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
