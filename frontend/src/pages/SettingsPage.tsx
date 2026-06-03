import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sun, Moon, Monitor, User, Settings, ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, updateUser, deleteUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  // Profile Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  // Sync state with current user info
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setCompanyName(user.companyName || "");
      setEmployeeId(user.employeeId || "");
    }
  }, [user]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required fields.");
      return;
    }
    updateUser(user.id, {
      name,
      email,
      companyName,
      employeeId,
    });
  };

  const handleDeleteAccount = () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to permanently delete your account? This action is irreversible."
    );
    if (confirmDelete) {
      deleteUser(user.id);
      logout();
      navigate("/login");
      toast.warning("Your account has been deleted.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your employee profile, general preferences, and security.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Navigation Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 bg-muted/40 p-1.5 rounded-xl border">
          <button
            onClick={() => setSearchParams({ tab: "profile" })}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "profile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            } justify-center md:justify-start flex-1 md:flex-initial`}
          >
            <User className="h-4 w-4" />
            <span>Profile Details</span>
          </button>
          <button
            onClick={() => setSearchParams({ tab: "settings" })}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "settings"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            } justify-center md:justify-start flex-1 md:flex-initial`}
          >
            <Settings className="h-4 w-4" />
            <span>Preferences</span>
          </button>
          <button
            onClick={() => setSearchParams({ tab: "security" })}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "security"
                ? "bg-background text-destructive shadow-sm"
                : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            } justify-center md:justify-start flex-1 md:flex-initial`}
          >
            <ShieldAlert className="h-4 w-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 w-full">
          {activeTab === "profile" && (
            <Card className="shadow-soft-sm">
              <CardHeader>
                <CardTitle className="text-base">Profile details</CardTitle>
                <CardDescription>
                  Update your organizational profile information and employee identity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border bg-muted/20">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="text-center sm:text-left space-y-1">
                      <p className="font-semibold text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="secondary" className="capitalize text-[10px] tracking-wide font-semibold mt-0.5">
                        {user?.role?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="prof-name">Full Name</Label>
                      <Input
                        id="prof-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Abinandu R S"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prof-email">Email Address</Label>
                      <Input
                        id="prof-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="abi@stockwise.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prof-company">Company / Warehouse</Label>
                      <Input
                        id="prof-company"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Central Warehouse A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prof-empid">Employee ID</Label>
                      <Input
                        id="prof-empid"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="EMP-002"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="sm">
                      Save Profile Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              {/* Appearance Selection */}
              <Card className="shadow-soft-sm">
                <CardHeader>
                  <CardTitle className="text-base">Appearance</CardTitle>
                  <CardDescription>
                    Choose your preferred display color scheme.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      ["light", Sun, "Light Mode"],
                      ["dark", Moon, "Dark Mode"],
                      ["system", Monitor, "System Default"],
                    ] as const).map(([value, Icon, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                          theme === value
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            theme === value ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="text-[10px] font-semibold">{label}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Notification Toggles */}
              <Card className="shadow-soft-sm">
                <CardHeader>
                  <CardTitle className="text-base">System Notifications</CardTitle>
                  <CardDescription>
                    Configure alerts and push notifications preferences.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Low stock level notifications",
                    "Purchase Order status changes",
                    "New suppliers and product logs",
                    "System updates & maintenance reports",
                  ].map((label, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Receive real-time alerts in navbar.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <Card className="border-red-500/20 bg-red-500/[0.01] shadow-soft-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                  <CardTitle className="text-base text-red-500">Danger Zone</CardTitle>
                </div>
                <CardDescription>
                  Actions here are irreversible. Please proceed with caution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.02]">
                  <div>
                    <p className="text-xs font-bold text-foreground">Delete account profile</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Permanently wipe credentials, login logs, and clear authorization access.
                    </p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
