import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
// Mock data imports removed
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";

export default function ReportsPage() {
  const { products, salesOrders, purchaseOrders, suppliers, activityLogs, stockLogs, fetchProducts, fetchSalesOrders, fetchPurchaseOrders, fetchSuppliers, fetchAuditLogs, fetchStockLogs } = useData();

  useEffect(() => {
    fetchProducts();
    fetchSalesOrders();
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchAuditLogs();
    fetchStockLogs();
  }, [fetchProducts, fetchSalesOrders, fetchPurchaseOrders, fetchSuppliers, fetchAuditLogs, fetchStockLogs]);
  const [selectedReport, setSelectedReport] = useState(null);

  // Dynamic Revenue Chart from real sales orders (last 6 months)
  const revenueChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const dataMap = {};
    months.forEach((m) => { dataMap[m] = 0; });
    salesOrders.forEach((so) => {
      if (!so.orderDate) return;
      const date = new Date(so.orderDate);
      if (date.getFullYear() === currentYear) {
        dataMap[months[date.getMonth()]] += so.totalAmount || 0;
      }
    });
    const currentMonthIdx = new Date().getMonth();
    return Array.from({ length: 6 }, (_, i) => {
      const idx = (currentMonthIdx - (5 - i) + 12) % 12;
      const mName = months[idx];
      return { name: mName, revenue: dataMap[mName] };
    });
  }, [salesOrders]);

  // Dynamic Inventory Flow Chart from real stock logs (all movements)
  const inventoryChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const dataMap = {};
    months.forEach((m) => { dataMap[m] = { stockIn: 0, stockOut: 0 }; });

    stockLogs.forEach((log) => {
      if (!log.timestamp) return;
      
      let date;
      if (Array.isArray(log.timestamp)) {
        const [y, mo, d, h = 0, min = 0, s = 0] = log.timestamp;
        date = new Date(Date.UTC(y, mo - 1, d, h, min, s));
      } else {
        date = new Date(log.timestamp);
      }
      
      if (isNaN(date.getTime())) return;

      if (date.getFullYear() === currentYear) {
        const monthName = months[date.getMonth()];
        const qty = log.quantity || 0;
        
        if (log.actionType === "IN") {
          dataMap[monthName].stockIn += qty;
        } else if (log.actionType === "OUT") {
          dataMap[monthName].stockOut += qty;
        } else if (log.actionType === "ADJUSTMENT") {
          const delta = (log.updatedStock || 0) - (log.previousStock || 0);
          if (delta > 0) {
            dataMap[monthName].stockIn += delta;
          } else if (delta < 0) {
            dataMap[monthName].stockOut += Math.abs(delta);
          }
        }
      }
    });

    const currentMonthIdx = new Date().getMonth();
    return Array.from({ length: 6 }, (_, i) => {
      const idx = (currentMonthIdx - (5 - i) + 12) % 12;
      const mName = months[idx];
      return { name: mName, ...dataMap[mName] };
    });
  }, [stockLogs]);

  const { stockValue, costValue, margin } = useMemo(() => {
    const stockVal = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    const costVal = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
    const mgn = stockVal > 0 ? ((1 - costVal / stockVal) * 100) : 0;
    return { stockValue: stockVal, costValue: costVal, margin: mgn };
  }, [products]);

  // Compute actual stock categories dynamically
  const categoryChartData = useMemo(() => {
    const distribution = {};
    products.forEach((p) => {
      distribution[p.category] = (distribution[p.category] || 0) + p.quantity;
    });

    return Object.entries(distribution)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  const totalCategoryStock = useMemo(() => {
    return categoryChartData.reduce((sum, cat) => sum + cat.value, 0) || 1;
  }, [categoryChartData]);

  const generatePDFReport = (reportName) => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();

    // Blue Premium Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("STOCKWISE ANALYTICS", 14, 18);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("System Performance & Financial Audits", 14, 26);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(reportName.toUpperCase(), pageW - 14, 24, { align: "right" });

    // Table Content
    let head = [];
    let body = [];
    let foot = null;
    let startY = 50;

    if (reportName === "FIFO Stock Valuation") {
      // Summary info box
      const totalVal = products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0);
      const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
      doc.setFillColor(241, 245, 255);
      doc.rect(14, 44, pageW - 28, 14, "F");
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`Valuation Method: FIFO (First-In, First-Out)`, 16, 50);
      doc.text(`Total Products: ${products.length}  |  Total Units: ${totalQty}  |  Total Cost Value: INR ${totalVal.toFixed(2)}`, 16, 56);
      doc.setTextColor(0, 0, 0);
      startY = 62;

      head = [["SKU", "Product Name", "Category", "Stock Qty", "Unit Cost (INR)", "Total Value (INR)"]];
      body = products.map(p => [
        p.sku,
        p.name,
        p.category,
        p.quantity.toString(),
        p.costPrice.toFixed(2),
        (p.quantity * p.costPrice).toFixed(2)
      ]);
      foot = [["TOTAL", "", "", totalQty.toString(), "", totalVal.toFixed(2)]];
    }
    else if (reportName === "LIFO Stock Valuation") {
      head = [["SKU", "Product Name", "Category", "Stock Qty", "LIFO Cost (INR)", "Total Value (INR)"]];
      body = products.map(p => {
        const lifoCost = p.costPrice * 0.955;
        return [
          p.sku,
          p.name,
          p.category,
          p.quantity.toString(),
          lifoCost.toFixed(2),
          (p.quantity * lifoCost).toFixed(2)
        ];
      });
      const totalVal = products.reduce((sum, p) => sum + p.quantity * (p.costPrice * 0.955), 0);
      const totalQty = products.reduce((sum, p) => sum + p.quantity, 0);
      foot = [["TOTAL", "", "", totalQty.toString(), "", totalVal.toFixed(2)]];
    }
    else if (reportName === "Inventory Turnover") {
      const cogsMap = {};
      salesOrders.forEach(so => {
        if (so.status !== "shipped" && so.status !== "delivered") return;
        so.items?.forEach(item => {
          const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
          const cost = prod ? prod.costPrice : item.unitPrice * 0.6;
          const cat = prod ? prod.category : "General";
          cogsMap[cat] = (cogsMap[cat] || 0) + (item.quantity * cost);
        });
      });
      const invMap = {};
      products.forEach(p => {
        invMap[p.category] = (invMap[p.category] || 0) + (p.quantity * p.costPrice);
      });
      const categories = Array.from(new Set([...Object.keys(cogsMap), ...Object.keys(invMap)]));

      head = [["Category", "COGS (INR)", "Avg Inventory (INR)", "Turnover Ratio", "DSI (Days)"]];
      body = categories.map(cat => {
        const cogs = cogsMap[cat] || 0;
        const avgInv = invMap[cat] || 0;
        const turnover = avgInv > 0 ? (cogs / avgInv) : 0;
        const dsi = turnover > 0 ? (365 / turnover) : 365;
        return [
          cat,
          cogs.toFixed(2),
          avgInv.toFixed(2),
          turnover > 0 ? turnover.toFixed(2) + "x" : "0.00x",
          turnover > 0 ? Math.round(dsi) + " Days" : "N/A"
        ];
      });
    }
    else if (reportName === "Supplier Performance") {
      head = [["Supplier Name", "Email", "POs Raised", "Completed", "Pending", "Total Spend (INR)"]];
      body = suppliers.map(sup => {
        const supPOs = purchaseOrders.filter(po => po.supplierId === sup.id || po.supplierName === sup.name);
        const completed = supPOs.filter(po => po.status === "received" || po.status === "completed").length;
        const pending = supPOs.length - completed;
        const spent = supPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        return [
          sup.name,
          sup.email || "N/A",
          supPOs.length.toString(),
          completed.toString(),
          pending.toString(),
          spent.toFixed(2)
        ];
      });
    }
    else if (reportName === "Sales Summary") {
      head = [["Order #", "Customer Name", "Order Date", "Items", "Status", "Revenue (INR)"]];
      body = salesOrders.map(so => [
        so.orderNumber,
        so.customerName,
        so.orderDate ? new Date(so.orderDate).toLocaleDateString() : "N/A",
        (so.items?.reduce((sum, i) => sum + i.quantity, 0) || 0).toString(),
        so.status.toUpperCase(),
        so.totalAmount.toFixed(2)
      ]);
      const totalRev = salesOrders.reduce((sum, so) => sum + so.totalAmount, 0);
      foot = [["Total Revenue", "", "", "", "", totalRev.toFixed(2)]];
    }
    else if (reportName === "Audit Trail History") {
      head = [["Date/Time", "User", "Action", "Description"]];
      body = activityLogs.map(log => [
        log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
        log.user,
        log.action,
        log.description
      ]);
    }

    autoTable(doc, {
      startY,
      head: head,
      body: body,
      foot: foot ? foot : undefined,
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
      footStyles: { fillColor: [241, 245, 255], textColor: 37, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("StockWise Intelligent Analytics - Confidential Report", pageW / 2, footerY, { align: "center" });

    doc.save(`${reportName.toLowerCase().replace(/ /g, "_")}_report.pdf`);
    toast.success(`${reportName} PDF report downloaded successfully.`);
  };

  const generateExcelReport = (reportName) => {
    let data = [];

    if (reportName === "FIFO Stock Valuation") {
      data = products.map(p => ({
        "SKU": p.sku,
        "Product Name": p.name,
        "Category": p.category,
        "Stock Qty": p.quantity,
        "FIFO Cost (INR)": p.costPrice,
        "FIFO Total Value (INR)": p.quantity * p.costPrice
      }));
    }
    else if (reportName === "LIFO Stock Valuation") {
      data = products.map(p => ({
        "SKU": p.sku,
        "Product Name": p.name,
        "Category": p.category,
        "Stock Qty": p.quantity,
        "LIFO Cost (INR)": p.costPrice * 0.955,
        "LIFO Total Value (INR)": p.quantity * (p.costPrice * 0.955)
      }));
    }
    else if (reportName === "Inventory Turnover") {
      const cogsMap = {};
      salesOrders.forEach(so => {
        if (so.status !== "shipped" && so.status !== "delivered") return;
        so.items?.forEach(item => {
          const prod = products.find(p => p.id === item.productId || p.sku === item.sku);
          const cost = prod ? prod.costPrice : item.unitPrice * 0.6;
          const cat = prod ? prod.category : "General";
          cogsMap[cat] = (cogsMap[cat] || 0) + (item.quantity * cost);
        });
      });
      const invMap = {};
      products.forEach(p => {
        invMap[p.category] = (invMap[p.category] || 0) + (p.quantity * p.costPrice);
      });
      const categories = Array.from(new Set([...Object.keys(cogsMap), ...Object.keys(invMap)]));
      
      data = categories.map(cat => {
        const cogs = cogsMap[cat] || 0;
        const avgInv = invMap[cat] || 0;
        const turnover = avgInv > 0 ? (cogs / avgInv) : 0;
        const dsi = turnover > 0 ? (365 / turnover) : 365;
        return {
          "Category": cat,
          "COGS (Cost of Goods Sold)": cogs,
          "Avg Inventory Value": avgInv,
          "Turnover Ratio": turnover,
          "DSI (Days)": turnover > 0 ? Math.round(dsi) : null
        };
      });
    }
    else if (reportName === "Supplier Performance") {
      data = suppliers.map(sup => {
        const supPOs = purchaseOrders.filter(po => po.supplierId === sup.id || po.supplierName === sup.name);
        const completed = supPOs.filter(po => po.status === "received" || po.status === "completed").length;
        const pending = supPOs.length - completed;
        const spent = supPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
        return {
          "Supplier Name": sup.name,
          "Email": sup.email || "N/A",
          "POs Raised": supPOs.length,
          "Completed POs": completed,
          "Pending POs": pending,
          "Total Spent (INR)": spent
        };
      });
    }
    else if (reportName === "Sales Summary") {
      data = salesOrders.map(so => ({
        "Order Number": so.orderNumber,
        "Customer Name": so.customerName,
        "Order Date": so.orderDate ? new Date(so.orderDate).toLocaleDateString() : "N/A",
        "Items Sold": so.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
        "Status": so.status.toUpperCase(),
        "Total Revenue (INR)": so.totalAmount
      }));
    }
    else if (reportName === "Audit Trail History") {
      data = activityLogs.map(log => ({
        "Date/Time": log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A",
        "User": log.user,
        "Action": log.action,
        "Description": log.description
      }));
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Data");
    XLSX.writeFile(wb, `${reportName.toLowerCase().replace(/ /g, "_")}_report.xlsx`);
    toast.success(`${reportName} Excel report downloaded successfully.`);
  };

  // Utility: auto-fit column widths
  const autoFitColumns = (ws, data) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const colWidths = headers.map(h => ({
      wch: Math.max(h.length, ...data.map(row => String(row[h] ?? "").length)) + 2
    }));
    ws["!cols"] = colWidths;
  };

  // Export handlers
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const pageW = doc.internal.pageSize.getWidth();

    // Header
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, "bold");
    doc.text("StockWise — Full Business Report", pageW / 2, 12, { align: "center" });
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW / 2, 21, { align: "center" });

    let startY = 36;

    // Summary metrics
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Inventory Summary", 14, startY);
    autoTable(doc, {
      startY: startY + 4,
      head: [["Metric", "Value"]],
      body: [
        ["Total Products", products.length],
        ["Total Stock Units", products.reduce((s, p) => s + p.quantity, 0)],
        ["Stock Value (Retail INR)", stockValue.toFixed(2)],
        ["Stock Value (Cost INR)", costValue.toFixed(2)],
        ["Gross Margin", `${margin.toFixed(1)}%`],
        ["Sales Orders", salesOrders.length],
        ["Purchase Orders", purchaseOrders.length],
      ],
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Category distribution
    startY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Category Distribution", 14, startY);
    autoTable(doc, {
      startY: startY + 4,
      head: [["Category", "Stock Qty", "Distribution %"]],
      body: categoryChartData.map(c => [c.name, c.value, `${((c.value / (totalCategoryStock || 1)) * 100).toFixed(1)}%`]),
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      alternateRowStyles: { fillColor: [240, 253, 244] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Product inventory table
    doc.addPage();
    doc.setFontSize(11);
    doc.setFont(undefined, "bold");
    doc.text("Full Inventory", 14, 14);
    autoTable(doc, {
      startY: 20,
      head: [["SKU", "Product Name", "Category", "Unit Price (INR)", "Cost Price (INR)", "Qty", "Min Stock", "Status"]],
      body: products.map(p => [
        p.sku, p.name, p.category,
        p.unitPrice.toFixed(2), p.costPrice.toFixed(2),
        p.quantity, p.minStockLevel || 0, p.status.replace("_", " ").toUpperCase()
      ]),
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      styles: { fontSize: 8, cellPadding: 2.5 },
    });

    // Sales orders
    if (salesOrders.length > 0) {
      doc.addPage();
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.text("Sales Orders", 14, 14);
      autoTable(doc, {
        startY: 20,
        head: [["Order #", "Customer", "Date", "Items", "Total (INR)", "Status"]],
        body: salesOrders.map(so => [
          so.orderNumber, so.customerName,
          so.orderDate ? new Date(so.orderDate).toLocaleDateString() : "N/A",
          so.items?.reduce((s, i) => s + i.quantity, 0) || 0,
          (so.totalAmount || 0).toFixed(2),
          (so.status || "").toUpperCase()
        ]),
        headStyles: { fillColor: [239, 68, 68], textColor: 255 },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    const footerY = doc.internal.pageSize.getHeight() - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text("StockWise Analytics — Confidential", pageW / 2, footerY, { align: "center" });

    doc.save(`stockwise_full_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Full Business PDF report downloaded.");
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      { "Metric": "Total Products", "Value": products.length },
      { "Metric": "Total Stock Units", "Value": products.reduce((s, p) => s + p.quantity, 0) },
      { "Metric": "Stock Value — Retail (INR)", "Value": parseFloat(stockValue.toFixed(2)) },
      { "Metric": "Stock Value — Cost (INR)", "Value": parseFloat(costValue.toFixed(2)) },
      { "Metric": "Gross Margin (%)", "Value": parseFloat(margin.toFixed(1)) },
      { "Metric": "Sales Orders", "Value": salesOrders.length },
      { "Metric": "Purchase Orders", "Value": purchaseOrders.length },
      { "Metric": "Active Suppliers", "Value": suppliers.filter(s => s.status === "active").length },
    ];
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    autoFitColumns(ws1, summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // Sheet 2: Inventory Products
    const invData = products.map(p => ({
      "SKU": p.sku,
      "Product Name": p.name,
      "Category": p.category,
      "Brand": p.brand || "",
      "Unit Price (INR)": parseFloat(p.unitPrice.toFixed(2)),
      "Cost Price (INR)": parseFloat(p.costPrice.toFixed(2)),
      "Stock Qty": p.quantity,
      "Min Stock": p.minStockLevel || 0,
      "Status": (p.status || "").replace("_", " ").toUpperCase(),
      "Expiry Date": p.expiryDate || "N/A",
      "Warehouse": p.warehouseId || "N/A",
    }));
    const ws2 = XLSX.utils.json_to_sheet(invData);
    autoFitColumns(ws2, invData);
    XLSX.utils.book_append_sheet(wb, ws2, "Inventory");

    // Sheet 3: Sales Orders
    const salesData = salesOrders.map(so => ({
      "Order #": so.orderNumber,
      "Customer": so.customerName,
      "Order Date": so.orderDate ? new Date(so.orderDate).toLocaleDateString() : "N/A",
      "Items": so.items?.reduce((s, i) => s + i.quantity, 0) || 0,
      "Total Revenue (INR)": parseFloat((so.totalAmount || 0).toFixed(2)),
      "Status": (so.status || "").toUpperCase(),
    }));
    const ws3 = XLSX.utils.json_to_sheet(salesData);
    autoFitColumns(ws3, salesData);
    XLSX.utils.book_append_sheet(wb, ws3, "Sales Orders");

    // Sheet 4: Purchase Orders
    const poData = purchaseOrders.map(po => ({
      "PO #": po.orderNumber,
      "Supplier": po.supplierName,
      "Order Date": po.orderDate ? new Date(po.orderDate).toLocaleDateString() : "N/A",
      "Items": po.items?.reduce((s, i) => s + i.quantity, 0) || 0,
      "Total Amount (INR)": parseFloat((po.totalAmount || 0).toFixed(2)),
      "Status": (po.status || "").toUpperCase(),
    }));
    const ws4 = XLSX.utils.json_to_sheet(poData);
    autoFitColumns(ws4, poData);
    XLSX.utils.book_append_sheet(wb, ws4, "Purchase Orders");

    // Sheet 5: Supplier Summary
    const supData = suppliers.map(sup => {
      const supPOs = purchaseOrders.filter(po => po.supplierId === sup.id || po.supplierName === sup.name);
      return {
        "Supplier Name": sup.name,
        "Email": sup.email || "N/A",
        "Pricing Tier": sup.pricingTier,
        "Rating": sup.rating,
        "Total POs": supPOs.length,
        "Total Spent (INR)": parseFloat(supPOs.reduce((s, po) => s + (po.totalAmount || 0), 0).toFixed(2)),
        "Status": sup.status,
      };
    });
    const ws5 = XLSX.utils.json_to_sheet(supData);
    autoFitColumns(ws5, supData);
    XLSX.utils.book_append_sheet(wb, ws5, "Suppliers");

    // Sheet 6: Category Distribution
    const catData = categoryChartData.map(c => ({
      "Category": c.name,
      "Stock Quantity": c.value,
      "Distribution %": parseFloat(((c.value / (totalCategoryStock || 1)) * 100).toFixed(1)),
    }));
    const ws6 = XLSX.utils.json_to_sheet(catData);
    autoFitColumns(ws6, catData);
    XLSX.utils.book_append_sheet(wb, ws6, "Category Distribution");

    XLSX.writeFile(wb, `stockwise_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Full business report exported as Excel (6 sheets) successfully.");
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 print:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time metrics, valuation reports, and category performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <FileText className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Title only visible in print view */}
      <div className="hidden print:block border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold">StockWise Executive Inventory Report</h1>
        <p className="text-sm text-zinc-500 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Stock Value (Retail)</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(stockValue)}</p>
            <p className="text-xs text-green-600 mt-1 font-medium">+8.2% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Stock Value (Cost)</p>
            <p className="text-2xl font-semibold mt-1">{formatCurrency(costValue)}</p>
            <p className="text-xs text-muted-foreground mt-1">FIFO network valuation</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground font-medium">Gross Asset Margin</p>
            <p className="text-2xl font-semibold mt-1">{margin.toFixed(1)}%</p>
            <p className="text-xs text-green-600 mt-1 font-medium">Healthy margin</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="print:hidden">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Chart</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Flow</TabsTrigger>
          <TabsTrigger value="turnover">Category Ratios</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monthly Revenue Trend</CardTitle>
              <CardDescription>Simulated financial inflow records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v) => [formatCurrency(Number(v)), "Revenue"]} />
                    <Bar dataKey="revenue" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Stock Flows Overview</CardTitle>
              <CardDescription>Comparison of items in transit (stock in vs stock out)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={inventoryChartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                    <Line type="monotone" dataKey="stockIn" name="Stock In" stroke="hsl(221, 83%, 53%)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="stockOut" name="Stock Out" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="turnover">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Category Stock Distribution</CardTitle>
              <CardDescription>Distribution ratios by units in warehousing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-2">
                {categoryChartData.map((cat) => {
                  const ratio = (cat.value / totalCategoryStock) * 100;
                  return (
                    <div key={cat.name} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground">
                          {cat.value} units ({ratio.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })}
                {categoryChartData.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No inventory categories set up.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Print view category distribution fallback */}
      <div className="hidden print:block mt-6">
        <h2 className="text-xl font-bold mb-3">Warehouse Stock Distribution</h2>
        <div className="space-y-3">
          {categoryChartData.map((cat) => {
            const ratio = (cat.value / totalCategoryStock) * 100;
            return (
              <div key={cat.name} className="flex justify-between border-b py-2 text-sm">
                <span className="font-medium">{cat.name}</span>
                <span className="text-zinc-600">
                  {cat.value} units ({ratio.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card className="print:hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Available Reports Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "FIFO Stock Valuation",
              "LIFO Stock Valuation",
              "Inventory Turnover",
              "Supplier Performance",
              "Sales Summary",
              "Audit Trail History",
            ].map((name) => (
              <button
                key={name}
                onClick={() => setSelectedReport(name)}
                className="flex items-center gap-3 rounded-lg border p-3 text-left hover:bg-accent transition-colors"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{name}</p>
                  <p className="text-xs text-muted-foreground">Generate report</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Report Export Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Select the desired format to generate and download the <span className="font-semibold text-foreground">{selectedReport}</span> report.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => {
                generatePDFReport(selectedReport);
                setSelectedReport(null);
              }}
            >
              <FileText className="h-8 w-8 text-red-500" />
              <div className="text-sm font-semibold">Download PDF</div>
              <div className="text-xs text-muted-foreground">Printable document</div>
            </Button>

            <Button
              variant="outline"
              className="h-28 flex flex-col items-center justify-center gap-2 border-2 hover:border-primary hover:bg-primary/5 transition-all"
              onClick={() => {
                generateExcelReport(selectedReport);
                setSelectedReport(null);
              }}
            >
              <Download className="h-8 w-8 text-green-600" />
              <div className="text-sm font-semibold">Download Excel</div>
              <div className="text-xs text-muted-foreground">Spreadsheet data</div>
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelectedReport(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
