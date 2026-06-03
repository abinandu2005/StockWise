import { motion } from "framer-motion";
import { Bell, Check, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useData } from "@/context/DataContext";
import { formatDateTime } from "@/lib/utils";

const iconMap = { info: Info, warning: AlertTriangle, success: CheckCircle, error: XCircle };
const colorMap = {
  info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  success: "bg-green-500/10 text-green-600 dark:text-green-400",
  error: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export default function NotificationsPage() {
  const { notifications, markNotificationsRead } = useData();
  const unread = notifications.filter(n => !n.read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-semibold tracking-tight">Notifications</h1><p className="text-sm text-muted-foreground mt-1">{unread} unread notifications</p></div>
        <Button variant="outline" size="sm" onClick={markNotificationsRead}><Check className="mr-2 h-4 w-4" />Mark all read</Button>
      </div>
      <div className="space-y-3">
        {notifications.map((n, idx) => {
          const Icon = iconMap[n.type];
          return (
            <motion.div key={n.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Card className={`hover:shadow-soft-md transition-shadow ${!n.read ? "border-primary/30 bg-primary/[0.02]" : ""}`}>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${colorMap[n.type]}`}><Icon className="h-4 w-4" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="text-sm font-medium">{n.title}</p>{!n.read && <div className="h-2 w-2 rounded-full bg-primary" />}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

