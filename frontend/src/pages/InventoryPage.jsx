import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Barcode,
  ChevronLeft,
  ChevronRight,
  Package,
  Scan,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CATEGORIES } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

const PER_PAGE = 6;
const statusCfg = {
  in_stock: { label: "In Stock", variant: "success" },
  low_stock: { label: "Low Stock", variant: "warning" },
  out_of_stock: { label: "Out of Stock", variant: "destructive" },
};

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock, addNotification, warehouses, fetchProducts, fetchWarehouses, globalSearch, setGlobalSearch } = useData();

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, [fetchProducts, fetchWarehouses]);
  const { user, hasPermission } = useAuth();

  const [search, setSearch] = useState(globalSearch || "");
  const [statusF, setStatusF] = useState("all");
  const [catF, setCatF] = useState("all");
  const [page, setPage] = useState(1);

  // Sync with Navbar global search
  useEffect(() => {
    if (globalSearch) {
      setSearch(globalSearch);
      setPage(1);
    }
  }, [globalSearch]);

  // Modal States
  const [addOpen, setAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [viewProd, setViewProd] = useState(null);
  const [barcodeProd, setBarcodeProd] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [prodToDelete, setProdToDelete] = useState(null);

  // Scanner State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerProductId, setScannerProductId] = useState("");
  const [scannerWarehouse, setScannerWarehouse] = useState("");
  const [scannerType, setScannerType] = useState("in");
  const [scannerQty, setScannerQty] = useState("1");
  const [scannerBarcodeText, setScannerBarcodeText] = useState("");

  const fileInputRef = useRef(null);

  // Form states for new/edit product
  const [formName, setFormName] = useState("");
  const [formSku, setFormSku] = useState("");
  const [formCategory, setFormCategory] = useState("General");
  const [formBrand, setFormBrand] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formQty, setFormQty] = useState("");
  const [formBarcode, setFormBarcode] = useState("");
  const [formMinStock, setFormMinStock] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formWarehouseId, setFormWarehouseId] = useState(""); // warehouse selection
  const [formExpiryDate, setFormExpiryDate] = useState("");    // for food/perishable products

  // Populate form for Editing
  const openEditModal = (p) => {
    setEditProduct(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormCategory(p.category);
    setFormBrand(p.brand || "");
    setFormPrice(p.unitPrice.toString());
    setFormCost(p.costPrice.toString());
    setFormQty(p.quantity.toString());
    setFormBarcode(p.barcode);
    setFormMinStock((p.minStockLevel || p.minStock || 0).toString());
    setFormDescription(p.description || "");
    setFormWarehouseId(p.warehouseId || warehouses[0]?.id || "");
    setFormExpiryDate(p.expiryDate || "");
  };

  // Populate form for Adding
  const openAddModal = () => {
    setFormName("");
    setFormSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setFormCategory("Electronics");
    setFormBrand("");
    setFormPrice("");
    setFormCost("");
    setFormQty("");
    setFormBarcode(Math.floor(1000000000000 + Math.random() * 9000000000000).toString());
    setFormMinStock("10");
    setFormDescription("");
    setFormExpiryDate("");
    // Default to first available warehouse
    setFormWarehouseId(warehouses[0]?.id || "");
    setAddOpen(true);
  };

  const handleAddSubmit = () => {
    if (!formName || !formSku || !formPrice || !formQty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const price = parseFloat(formPrice) || 0;
    const cost = parseFloat(formCost) || 0;
    const qty = parseInt(formQty) || 0;
    const minSt = parseInt(formMinStock) || 10;

    let prodStatus = "in_stock";
    if (qty <= 0) prodStatus = "out_of_stock";
    else if (qty <= minSt) prodStatus = "low_stock";

    // Set initial warehouse stock using selected warehouse
    const whStock = {};
    let selectedWh = warehouses.find(w => w.id === formWarehouseId);
    if (!selectedWh && warehouses.length > 0) selectedWh = warehouses[0];
    const whKey = selectedWh?.name || "Main Warehouse";
    whStock[whKey] = qty;

    const newProd = {
      name: formName,
      sku: formSku,
      category: formCategory,
      brand: formBrand,
      unitPrice: price,
      costPrice: cost,
      quantity: qty,
      barcode: formBarcode,
      minStockLevel: minSt,
      minStock: minSt,
      description: formDescription,
      warehouseStock: whStock,
      warehouseId: selectedWh?.id || "",
      expiryDate: formExpiryDate || null,
    };

    addProduct(newProd);
    setAddOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editProduct) return;
    if (!formName || !formSku || !formPrice || !formQty) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const price = parseFloat(formPrice) || 0;
    const cost = parseFloat(formCost) || 0;
    const qty = parseInt(formQty) || 0;
    const minSt = parseInt(formMinStock) || 10;

    let prodStatus = "in_stock";
    if (qty <= 0) prodStatus = "out_of_stock";
    else if (qty <= minSt) prodStatus = "low_stock";

    // Update selected warehouse stock; keep other warehouse qtys intact
    const currentWhStock = { ...(editProduct.warehouseStock || {}) };
    let selectedWh = warehouses.find(w => w.id === formWarehouseId);
    if (!selectedWh && warehouses.length > 0) selectedWh = warehouses[0];
    const targetWhName = selectedWh?.name || "Main Warehouse";
    // Recompute: qty from all OTHER warehouses + qty assigned to selected warehouse
    const otherWhQty = Object.entries(currentWhStock)
      .filter(([name]) => name !== targetWhName)
      .reduce((sum, [, q]) => sum + q, 0);
    currentWhStock[targetWhName] = Math.max(0, qty - otherWhQty);

    const updates = {
      name: formName,
      sku: formSku,
      category: formCategory,
      brand: formBrand,
      unitPrice: price,
      costPrice: cost,
      quantity: qty,
      barcode: formBarcode,
      minStockLevel: minSt,
      minStock: minSt,
      description: formDescription,
      status: prodStatus,
      warehouseStock: currentWhStock,
      warehouseId: selectedWh?.id || editProduct.warehouseId || "",
      expiryDate: formExpiryDate || null,
    };

    updateProduct(editProduct.id, updates);
    setEditProduct(null);
  };

  // Excel Import/Export handlers
  const handleExport = () => {
    const data = products.map((p) => ({
      Name: p.name,
      SKU: p.sku,
      Category: p.category,
      Brand: p.brand || "",
      "Unit Price (₹)": p.unitPrice,
      "Cost Price (₹)": p.costPrice,
      Quantity: p.quantity,
      Barcode: p.barcode,
      "Min Stock": p.minStockLevel || p.minStock || 0,
      Status: p.status,
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Products");
    XLSX.writeFile(wb, `stockwise_products_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Products exported as Excel (.xlsx) successfully.");
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) return;

      try {
        const lines = text.split("\n");
        if (lines.length < 2) return;

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const name = values[headers.indexOf("Name")] || "Imported Product";
          const sku = values[headers.indexOf("SKU")] || `SKU-IMP-${Math.floor(Math.random() * 900)}`;
          const category = values[headers.indexOf("Category")] || "General";
          const brand = values[headers.indexOf("Brand")] || "Generic";
          const unitPrice = parseFloat(values[headers.indexOf("UnitPrice")]) || 0;
          const costPrice = parseFloat(values[headers.indexOf("CostPrice")]) || 0;
          const qty = parseInt(values[headers.indexOf("Quantity")]) || 0;
          const barcode = values[headers.indexOf("Barcode")] || Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
          const minStock = parseInt(values[headers.indexOf("MinStock")]) || 10;

          let prodStatus = "in_stock";
          if (qty <= 0) prodStatus = "out_of_stock";
          else if (qty <= minStock) prodStatus = "low_stock";

          const whStock = {};
          const firstWhName = warehouses[0]?.name || "Main Warehouse";
          whStock[firstWhName] = qty;

          addProduct({
            name,
            sku,
            category,
            brand,
            unitPrice,
            costPrice,
            quantity: qty,
            barcode,
            minStockLevel: minStock,
            minStock,
            description: "CSV Imported Product.",
            warehouseStock: whStock,
          });
          count++;
        }
        toast.success(`Successfully imported ${count} products.`);
      } catch (err) {
        toast.error("Failed to parse CSV. Please ensure formatting matches template headers.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Warehouse Scan flow adjustment handler
  const handleScannerSubmit = () => {
    if (!scannerProductId) {
      toast.error("Please select a product.");
      return;
    }
    if (!scannerWarehouse) {
      toast.error("Please select a warehouse.");
      return;
    }

    const prod = products.find((p) => p.id === scannerProductId);
    if (!prod) return;

    const qty = parseInt(scannerQty) || 0;
    if (qty <= 0) {
      toast.error("Quantity must be greater than zero.");
      return;
    }

    const currentQty = prod.quantity;
    const currentWhQty = prod.warehouseStock?.[scannerWarehouse] || 0;

    if (scannerType === "out" && currentWhQty < qty) {
      toast.error(`Insufficient stock in ${scannerWarehouse}. Available: ${currentWhQty}`);
      return;
    }

    const nextWhQty = scannerType === "in" ? currentWhQty + qty : currentWhQty - qty;
    const nextQty   = scannerType === "in" ? currentQty + qty   : currentQty - qty;

    // Use DataContext adjustProductStock which handles backend audit-log + notification + warehouse stock internally
    adjustProductStock(prod.id, qty, scannerType, scannerWarehouse);

    setScannerOpen(false);
  };

  const handleSimulateLaserScan = () => {
    if (!scannerBarcodeText) {
      toast.error("Please enter a barcode number first.");
      return;
    }
    const found = products.find((p) => p.barcode === scannerBarcodeText || p.sku.toLowerCase() === scannerBarcodeText.toLowerCase());
    if (found) {
      setScannerProductId(found.id);
      toast.success(`Scanned: "${found.name}"`);
    } else {
      toast.error("Barcode not recognized. Try one from the products grid.");
    }
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.includes(search);
      return (
        matchSearch &&
        (statusF === "all" || p.status === statusF) &&
        (catF === "all" || p.category === catF)
      );
    });
  }, [products, search, statusF, catF]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your products and stock levels</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Invisible file input for CSV Import */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv"
            onChange={handleImport}
          />
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>

          {/* Scanner Button (Warehouse Staff & Admin) */}
          {hasPermission("scan_stock") && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setScannerProductId(products[0]?.id || "");
                setScannerWarehouse(warehouses[0]?.name || "Main Warehouse");
                setScannerBarcodeText("");
                setScannerType("in");
                setScannerQty("1");
                setScannerOpen(true);
              }}
            >
              <Scan className="mr-2 h-4 w-4 text-primary" />
              Scan Barcode
            </Button>
          )}

          {/* Add Product Button (Purchase Manager & Admin) */}
          {(user?.role === "admin" || user?.role === "purchase_manager") && (
            <Button size="sm" onClick={openAddModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, barcode..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Tabs value={statusF} onValueChange={(v) => { setStatusF(v); setPage(1); }}>
              <TabsList>
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="in_stock" className="text-xs">In Stock</TabsTrigger>
                <TabsTrigger value="low_stock" className="text-xs">Low</TabsTrigger>
                <TabsTrigger value="out_of_stock" className="text-xs">Out</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {["all", ...CATEGORIES.slice(0, 5)].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCatF(c);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  catF === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "text-muted-foreground hover:border-primary/50"
                }`}
              >
                {c === "all" ? "All Categories" : c}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Product</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">SKU</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Category</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Price</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total Qty</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.sku}</code>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">{p.category}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{formatCurrency(p.unitPrice)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium">{p.quantity}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={statusCfg[p.status].variant} className="text-[10px]">
                      {statusCfg[p.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setViewProd(p)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(user?.role === "admin" || user?.role === "warehouse_staff") && (
                          <DropdownMenuItem onClick={() => openEditModal(p)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setBarcodeProd(p)}>
                          <Barcode className="mr-2 h-4 w-4" />
                          Print Barcode
                        </DropdownMenuItem>
                        {user?.role === "admin" && (
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              setProdToDelete(p);
                              setDeleteConfirmOpen(true);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Button
                  key={n}
                  variant={n === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8 text-xs"
                  onClick={() => setPage(n)}
                >
                  {n}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Add Product Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Enter the product details below to add it to catalog.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name*</Label>
                <Input placeholder="e.g. Wireless Mouse" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU*</Label>
                <Input placeholder="e.g. SKU-009" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Electronics" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input placeholder="e.g. TechBrand" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Unit Price (₹)*</Label>
                <Input type="number" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (₹)</Label>
                <Input type="number" placeholder="0.00" value={formCost} onChange={(e) => setFormCost(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Qty*</Label>
                <Input type="number" placeholder="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input placeholder="8901234567890" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Min Stock Warning Level</Label>
                <Input type="number" placeholder="10" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} />
              </div>
            </div>
            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label>Store in Warehouse*</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
              >
                {warehouses.length === 0 && (
                  <option value="">Main Warehouse (default)</option>
                )}
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} — {wh.location || wh.city || ""}
                  </option>
                ))}
              </select>
            </div>
            {/* Expiry Date — for food/perishable products */}
            <div className="space-y-2">
              <Label>Expiry Date <span className="text-muted-foreground text-xs">(optional — for food/perishable items)</span></Label>
              <Input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="General product description..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product Details</DialogTitle>
            <DialogDescription>Modify fields and click Save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name*</Label>
                <Input placeholder="e.g. Wireless Mouse" value={formName} onChange={(e) => setFormName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>SKU*</Label>
                <Input placeholder="e.g. SKU-009" value={formSku} onChange={(e) => setFormSku(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input placeholder="e.g. Electronics" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Brand</Label>
                <Input placeholder="e.g. TechBrand" value={formBrand} onChange={(e) => setFormBrand(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Unit Price (₹)*</Label>
                <Input type="number" placeholder="0.00" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price (₹)</Label>
                <Input type="number" placeholder="0.00" value={formCost} onChange={(e) => setFormCost(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Total Qty*</Label>
                <Input type="number" placeholder="0" value={formQty} onChange={(e) => setFormQty(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Barcode</Label>
                <Input placeholder="8901234567890" value={formBarcode} onChange={(e) => setFormBarcode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Min Stock Level</Label>
                <Input type="number" placeholder="10" value={formMinStock} onChange={(e) => setFormMinStock(e.target.value)} />
              </div>
            </div>
            {/* Warehouse Selection */}
            <div className="space-y-2">
              <Label>Assigned Warehouse</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formWarehouseId}
                onChange={(e) => setFormWarehouseId(e.target.value)}
              >
                {warehouses.length === 0 && <option value="">Main Warehouse (default)</option>}
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name} — {wh.location || wh.city || ""}</option>
                ))}
              </select>
            </div>
            {/* Expiry Date — for food/perishable products */}
            <div className="space-y-2">
              <Label>Expiry Date <span className="text-muted-foreground text-xs">(optional — for food/perishable items)</span></Label>
              <Input
                type="date"
                value={formExpiryDate}
                onChange={(e) => setFormExpiryDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Details Modal */}
      <Dialog open={!!viewProd} onOpenChange={() => setViewProd(null)}>
        <DialogContent className="sm:max-w-lg">
          {viewProd && (
            <>
              <DialogHeader>
                <DialogTitle>{viewProd.name}</DialogTitle>
                <DialogDescription>{viewProd.description || "No description provided."}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">SKU</p>
                    <p className="text-sm font-medium">{viewProd.sku}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Barcode</p>
                    <p className="text-sm font-medium">{viewProd.barcode}</p>
                  </div>
                </div>
                {viewProd.brand && (
                  <div>
                    <p className="text-xs text-muted-foreground">Brand</p>
                    <p className="text-sm font-medium">{viewProd.brand}</p>
                  </div>
                )}
                {viewProd.expiryDate && (
                  <div className={`rounded-lg p-2 border ${new Date(viewProd.expiryDate) < new Date() ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-amber-200 bg-amber-50 dark:bg-amber-950/20"}`}>
                    <p className="text-xs text-muted-foreground">Expiry Date</p>
                    <p className={`text-sm font-semibold ${new Date(viewProd.expiryDate) < new Date() ? "text-red-600" : "text-amber-600"}`}>
                      {new Date(viewProd.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                      {new Date(viewProd.expiryDate) < new Date() ? " ⚠ EXPIRED" : ""}
                    </p>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="text-sm font-medium">{formatCurrency(viewProd.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost</p>
                    <p className="text-sm font-medium">{formatCurrency(viewProd.costPrice)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Qty</p>
                    <p className="text-sm font-medium">{viewProd.quantity} units</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Warehouse Location</p>
                  {Object.entries(viewProd.warehouseStock || {}).length > 0 ? (
                    Object.entries(viewProd.warehouseStock).map(([wh, qty]) => (
                      <div key={wh} className="flex justify-between items-center text-sm py-1.5 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <span>{wh}</span>
                        </div>
                        <span className="font-semibold">{qty} units</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      {viewProd.warehouseId ? `Assigned to warehouse ID: ${viewProd.warehouseId}` : "No warehouse assignment."}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Print Modal */}
      <Dialog open={!!barcodeProd} onOpenChange={() => setBarcodeProd(null)}>
        <DialogContent className="sm:max-w-sm">
          {barcodeProd && (
            <>
              <DialogHeader>
                <DialogTitle>Barcode Label</DialogTitle>
                <DialogDescription>Print labels for inventory items.</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center justify-center p-6 bg-white border border-dashed rounded-lg dark:bg-zinc-950 dark:border-zinc-800 space-y-4">
                <span className="text-sm font-semibold tracking-wide text-zinc-900 dark:text-white uppercase">
                  {barcodeProd.brand || "StockWise"}
                </span>
                
                {/* Simulated barcode graphic */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="h-12 w-48 flex items-stretch gap-0.5 justify-center bg-zinc-900 p-1">
                    {barcodeProd.barcode.split("").map((digit, index) => {
                      const width = (parseInt(digit) % 3) + 1; // mock width variance
                      return (
                        <div
                          key={index}
                          className="bg-white"
                          style={{
                            width: `${width}px`,
                            opacity: index % 2 === 0 ? 1 : 0,
                          }}
                        />
                      );
                    })}
                  </div>
                  <span className="text-[10px] font-mono tracking-[4px] text-zinc-600 dark:text-zinc-400">
                    {barcodeProd.barcode}
                  </span>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-medium text-zinc-900 dark:text-white">{barcodeProd.name}</p>
                  <p className="text-[10px] text-zinc-500">{barcodeProd.sku}</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBarcodeProd(null)}>
                  Close
                </Button>
                <Button onClick={() => { toast.success("Sent to barcode printer label queue."); setBarcodeProd(null); }}>
                  Print Label
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Warehouse Staff / Admin Stock flow scanner Dialog */}
      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Warehouse Stock Flow Scanner</DialogTitle>
            <DialogDescription>
              Simulate barcode scan logging or adjust stock manually in/out.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Simulate Barcode Input / SKU Scan</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter Barcode (e.g. 8901234567890) or SKU..."
                  value={scannerBarcodeText}
                  onChange={(e) => setScannerBarcodeText(e.target.value)}
                />
                <Button type="button" onClick={handleSimulateLaserScan}>
                  Scan
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Tip barcode text from the product details modal.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="scanner-product">Selected Product*</Label>
              <select
                id="scanner-product"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={scannerProductId}
                onChange={(e) => setScannerProductId(e.target.value)}
              >
                <option value="" disabled>-- Choose Product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scanner-warehouse">Target Warehouse*</Label>
                <select
                  id="scanner-warehouse"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={scannerWarehouse}
                  onChange={(e) => setScannerWarehouse(e.target.value)}
                >
                  <option value="" disabled>-- Choose Warehouse --</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.name}>
                      {wh.name}
                    </option>
                  ))}
                  {warehouses.length === 0 && (
                    <option value="Main Warehouse">Main Warehouse</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Operation Type</Label>
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant={scannerType === "in" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setScannerType("in")}
                  >
                    Scan IN
                  </Button>
                  <Button
                    type="button"
                    variant={scannerType === "out" ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setScannerType("out")}
                  >
                    Scan OUT
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scanner-qty">Scan Adjust Quantity*</Label>
              <Input
                id="scanner-qty"
                type="number"
                min="1"
                value={scannerQty}
                onChange={(e) => setScannerQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScannerOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScannerSubmit}>Execute Flow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete product <span className="font-semibold text-foreground">{prodToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Keep Product
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (prodToDelete) {
                  deleteProduct(prodToDelete.id);
                  setDeleteConfirmOpen(false);
                  setProdToDelete(null);
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
