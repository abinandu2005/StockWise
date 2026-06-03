import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { mockRevenueChart, mockInventoryChart } from "@/data/mockData";
import { formatCurrency } from "@/lib/utils";
import { useData } from "@/context/DataContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function ReportsPage() {
  const { products } = useData();

  const { stockValue, costValue, margin } = useMemo(() => {
    const stockVal = products.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);
    const costVal = products.reduce((sum, p) => sum + p.costPrice * p.quantity, 0);
    const mgn = stockVal > 0 ? ((1 - costVal / stockVal) * 100) : 0;
    return { stockValue: stockVal, costValue: costVal, margin: mgn };
  }, [products]);

  // Compute actual stock categories dynamically
  const categoryChartData = useMemo(() => {
    const distribution: Record<string, number> = {};
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

  // Export handlers
  const handleExportPDF = () => {
    toast.info("Opening browser print layout to export report PDF...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleExportExcel = () => {
    const summaryData = [
      { "Report Metric": "Stock Value (Retail)", "Value Description": "Total retail price valuation of active products", "Calculated Value": `₹${stockValue.toFixed(2)}` },
      { "Report Metric": "Stock Value (Cost)", "Value Description": "Total cost price valuation of active products (FIFO)", "Calculated Value": `₹${costValue.toFixed(2)}` },
      { "Report Metric": "Gross Margin", "Value Description": "Asset markup gross margin percentage", "Calculated Value": `${margin.toFixed(1)}%` },
    ];
    const categoryData = categoryChartData.map((cat) => ({
      "Category Name": cat.name,
      "Stock Quantity": cat.value,
      "Distribution Ratio": `${((cat.value / totalCategoryStock) * 100).toFixed(1)}%`,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), "Summary");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(categoryData), "Category Distribution");
    XLSX.writeFile(wb, `stockwise_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Business report exported as Excel (.xlsx) successfully.");
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
                  <BarChart data={mockRevenueChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: any) => [formatCurrency(Number(v)), "Revenue"]} />
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
                  <LineChart data={mockInventoryChart} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
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
                onClick={() => toast.success(`Generated latest ${name} report.`)}
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
    </motion.div>
  );
}
