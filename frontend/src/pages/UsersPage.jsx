import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, MoreHorizontal, Edit, Trash2, CheckCircle, XCircle, Plus, Users, ShieldCheck, Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const roleCfg = {
  admin: { label: "Admin", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
  warehouse_staff: { label: "Staff", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  purchase_manager: { label: "Manager", color: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
};

export default function UsersPage() {
  const { users, addUser, updateUser, deleteUser, approveUser, user: currentUser, fetchUsers } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  const [activeTab, setActiveTab] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("warehouse_staff");
  const [status, setStatus] = useState("active");
  const [companyName, setCompanyName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const openAddModal = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("warehouse_staff");
    setStatus("active");
    setCompanyName("");
    setEmployeeId("");
    setAddOpen(true);
  };

  const openEditModal = (u) => {
    setEditUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword(""); // Keep blank to not change password
    setRole(u.role);
    setStatus(u.status || "active");
    setCompanyName(u.companyName || "");
    setEmployeeId(u.employeeId || "");
  };

  const handleAddSubmit = () => {
    if (!name || !email) {
      toast.error("Please enter a name and email.");
      return;
    }

    addUser({
      name,
      email,
      password: password || "staff123",
      role,
      status,
      companyName: companyName || "StockWise Network",
      employeeId: employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setAddOpen(false);
  };

  const handleEditSubmit = () => {
    if (!editUser) return;
    if (!name || !email) {
      toast.error("Please enter a name and email.");
      return;
    }

    const updates = {
      name,
      email,
      role,
      status,
      companyName,
      employeeId,
    };
    if (password) {
      updates.password = password;
    }

    updateUser(editUser.id, updates);
    setEditUser(null);
  };

  const pendingCount = useMemo(() => {
    return users.filter(u => u.status === "pending").length;
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (activeTab === "pending") {
      return users.filter(u => u.status === "pending");
    }
    if (activeTab === "active") {
      return users.filter(u => u.status === "active");
    }
    return users; // 'all'
  }, [users, activeTab]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage system accounts, employee clearance levels, and verify registrations.</p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" className="text-xs">
            All Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Active Accounts
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-xs relative">
            Pending Approvals
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">User Profile</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Identity/EmpID</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">Role</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Last Login</th>
                <th className="text-center text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold">{u.employeeId || "N/A"}</p>
                      <p className="text-muted-foreground">{u.companyName || "N/A"}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell font-medium">
                    <Badge className={`text-[10px] font-semibold uppercase ${roleCfg[u.role]?.color}`}>
                      {roleCfg[u.role]?.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                    {u.lastLogin ? formatDate(u.lastLogin) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={u.status === "active" ? "success" : u.status === "pending" ? "warning" : "secondary"} className="text-[10px] uppercase">
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                          onClick={() => approveUser(u.id)}
                          title="Approve User Registration"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditModal(u)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          {currentUser?.id !== u.id && (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setUserToDelete(u);
                                setDeleteConfirmOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <Users className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No users in this view</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add System User</DialogTitle>
            <DialogDescription>Create a new user profile with pre-configured access privileges.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name*</Label>
                <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email Address*</Label>
                <Input type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-company">Company/Warehouse Name</Label>
                <Input placeholder="Main Warehouse" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-emp-id">Employee ID</Label>
                <Input placeholder="EMP-4456" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-pwd">Password (defaults to 'staff123')</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Role</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="admin">Admin (Full System access)</option>
                  <option value="warehouse_staff">Warehouse Staff (Quantities scans)</option>
                  <option value="purchase_manager">Purchase Manager (Suppliers & orders)</option>
                </select>
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
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSubmit}>Create Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
            <DialogDescription>Modify fields and privileges.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name*</Label>
                <Input placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email Address*</Label>
                <Input type="email" placeholder="john@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company/Warehouse</Label>
                <Input placeholder="Main Warehouse" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Employee ID</Label>
                <Input placeholder="EMP-4456" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Change Password (leave blank to keep current)</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>System Role</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="warehouse_staff">Warehouse Staff</option>
                  <option value="purchase_manager">Purchase Manager</option>
                </select>
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
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
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
            <DialogTitle>Delete User Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete user account <span className="font-semibold text-foreground">{userToDelete?.name}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              No, Keep Account
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (userToDelete) {
                  deleteUser(userToDelete.id);
                  setDeleteConfirmOpen(false);
                  setUserToDelete(null);
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
