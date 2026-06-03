import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, ArrowUpRight, ArrowDownRight, Clock,
  Search, PackageCheck, ShoppingCart, Filter,
  Calendar, User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useData } from "@/context/DataContext";
import { useAuth } from "@/context/AuthContext";
import { formatDateTime } from "@/lib/utils";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

type ActivityFilter = "all" | "stock_in" | "stock_out" | "order" | "system";

export default function MyActivityPage() {
  const { activityLogs } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ActivityFilter>("all");

  // Filter activity logs to current user only
  const myLogs = useMemo(() => {
    if (!user) return [];
    return activityLogs
      .filter((log) => log.user.toLowerCase() === user.name.toLowerCase())
      .filter(
        (log) =>
          search === "" ||
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter((log) => {
        if (filter === "all") return true;
        // Map Receive PO logs to stock_in
        if (filter === "stock_in") return log.type === "stock_in";
        if (filter === "stock_out") return log.type === "stock_out";
        if (filter === "order") return log.type === "order";
        return log.type === "system" || log.type === "user";
      });
  }, [activityLogs, user, search, filter]);

  // Summary counts
  const totalActions = myLogs.length;
  const stockInCount = myLogs.filter((l) => l.type === "stock_in").length;
  const stockOutCount = myLogs.filter((l) => l.type === "stock_out").length;
  const otherCount = myLogs.filter(
    (l) => l.type !== "stock_in" && l.type !== "stock_out"
  ).length;

  // Get icon and color for activity type
  const getActivityStyle = (log: (typeof myLogs)[0]) => {
    if (log.action.includes("Scan In") || log.type === "stock_in") {
      return {
        icon: ArrowUpRight,
        bgColor: "bg-green-500/10",
        iconColor: "text-green-600 dark:text-green-400",
        label: "Stock In",
        badgeVariant: "success" as const,
      };
    }
    if (log.action.includes("Scan Out") || log.type === "stock_out") {
      return {
        icon: ArrowDownRight,
        bgColor: "bg-blue-500/10",
        iconColor: "text-blue-600 dark:text-blue-400",
        label: "Stock Out",
        badgeVariant: "secondary" as const,
      };
    }
    if (log.type === "order") {
      return {
        icon: ShoppingCart,
        bgColor: "bg-violet-500/10",
        iconColor: "text-violet-600 dark:text-violet-400",
        label: "Order",
        badgeVariant: "secondary" as const,
      };
    }
    return {
      icon: Activity,
      bgColor: "bg-muted",
      iconColor: "text-muted-foreground",
      label: "System",
      badgeVariant: "secondary" as const,
    };
  };

  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, typeof myLogs> = {};
    myLogs.forEach((log) => {
      const date = log.timestamp.split("T")[0];
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [myLogs]);

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    return date.toLocaleDateString("en-IN", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your personal action history and work log
          </p>
        </div>
        <Badge variant="secondary" className="w-fit gap-1.5 text-xs">
          <User className="h-3 w-3" />
          {user?.name}
        </Badge>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{totalActions}</p>
                  <p className="text-xs text-muted-foreground">Total Actions</p>
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
                  <ArrowUpRight className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stockInCount}</p>
                  <p className="text-xs text-muted-foreground">Stock In</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                  <ArrowDownRight className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stockOutCount}</p>
                  <p className="text-xs text-muted-foreground">Stock Out</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={item}>
          <Card className="hover:shadow-soft-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                  <PackageCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{otherCount}</p>
                  <p className="text-xs text-muted-foreground">Other Actions</p>
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
                  placeholder="Search your activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Tabs value={filter} onValueChange={(v) => setFilter(v as ActivityFilter)}>
                <TabsList>
                  <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                  <TabsTrigger value="stock_in" className="text-xs">Stock In</TabsTrigger>
                  <TabsTrigger value="stock_out" className="text-xs">Stock Out</TabsTrigger>
                  <TabsTrigger value="order" className="text-xs">Orders</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Timeline */}
      <motion.div variants={item}>
        {groupedLogs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium">No activity found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search || filter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Your actions will appear here as you work"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedLogs.map(([date, logs]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    {formatDateLabel(date)}
                  </h3>
                  <div className="flex-1 h-px bg-border" />
                  <Badge variant="secondary" className="text-[10px]">
                    {logs.length} {logs.length === 1 ? "action" : "actions"}
                  </Badge>
                </div>

                {/* Activity Items */}
                <Card>
                  <CardContent className="p-0">
                    {logs.map((log, idx) => {
                      const style = getActivityStyle(log);
                      const Icon = style.icon;
                      return (
                        <div
                          key={log.id}
                          className={`flex gap-4 p-4 hover:bg-muted/30 transition-colors ${
                            idx < logs.length - 1 ? "border-b" : ""
                          }`}
                        >
                          {/* Timeline indicator */}
                          <div className="flex flex-col items-center">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${style.bgColor} shrink-0`}>
                              <Icon className={`h-4 w-4 ${style.iconColor}`} />
                            </div>
                            {idx < logs.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-2" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className="text-sm font-semibold">{log.action}</p>
                                  <Badge variant={style.badgeVariant} className="text-[10px]">
                                    {style.label}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {log.description}
                                </p>
                              </div>
                              <p className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
