import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, ArrowUpRight, ArrowDownRight, ShoppingCart, User, Settings, Search, Trash2, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { toast } from "sonner";
import { useData } from "@/context/DataContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const iconMap = {
  "Stock Scan In": ArrowUpRight,
  "Stock Scan Out": ArrowDownRight,
  stock_in: ArrowUpRight,
  stock_out: ArrowDownRight,
  order: ShoppingCart,
  user: User,
  system: Settings,
};

const colorMap = {
  "Stock Scan In": "bg-green-500/10 text-green-600 dark:text-green-400",
  "Stock Scan Out": "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  stock_in: "bg-green-500/10 text-green-600 dark:text-green-400",
  stock_out: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  order: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  user: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  system: "bg-muted text-muted-foreground",
};

export default function AuditLogsPage() {
  const [typeFilter, setTypeFilter] = useState("all");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { activityLogs, clearAuditLogs, fetchAuditLogs, globalSearch } = useData();
  const [refreshing, setRefreshing] = useState(false);

  // Initialise local search from the Navbar global search
  const [search, setSearch] = useState(globalSearch || "");

  // Keep in sync if Navbar search changes while on this page
  useEffect(() => {
    if (globalSearch) setSearch(globalSearch);
  }, [globalSearch]);

  // Always force-refresh from backend on every page visit
  useEffect(() => {
    fetchAuditLogs(true);
  }, [fetchAuditLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAuditLogs(true);
    setRefreshing(false);
    toast.success("Audit trail refreshed.");
  };


  const logs = useMemo(() => {
    return activityLogs.map((l) => ({
      ...l,
      type: l.action?.toLowerCase().includes("scan") ? l.action
        : (l.action?.toLowerCase().includes("user") || l.module === "USER_MANAGEMENT") ? "user"
        : l.type
    }));
  }, [activityLogs]);

  const handleClearLogs = () => {
    setDeleteConfirmOpen(true);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.description.toLowerCase().includes(search.toLowerCase()) ||
        log.user.toLowerCase().includes(search.toLowerCase());

      const matchesType =
        typeFilter === "all" ||
        log.type === typeFilter ||
        (typeFilter === "inventory" && (log.type.includes("Scan") || log.type.includes("stock")));

      return matchesSearch && matchesType;
    });
  }, [logs, search, typeFilter]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Logs</h1>
          <p className="text-sm text-muted-foreground mt-1">System activity, security records, and stock adjustment history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteConfirmOpen(true)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit trail by user, action, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Log Types</option>
            <option value="inventory">Inventory & Scans</option>
            <option value="order">Orders Flow</option>
            <option value="user">User Actions</option>
            <option value="system">System Logs</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredLogs.map((log, idx) => {
              const Icon = iconMap[log.type] || iconMap[log.action] || Activity;
              const typeLabel = typeof log.type === "string" ? log.type.replace("_", " ") : "system";
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${colorMap[log.type] || colorMap[log.action] || "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{log.action}</p>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                        {typeLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{log.user}</span>
                      <span>{formatDateTime(log.timestamp)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filteredLogs.length === 0 && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                No activity logs found matching the filter criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clear Logs Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Audit Logs</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently clear all activity and audit logs from MongoDB? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Keep Logs
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAuditLogs();
                setDeleteConfirmOpen(false);
              }}
            >
              Yes, Clear Logs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
