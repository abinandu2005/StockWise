import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, Check, X } from "lucide-react";
import type { UserRole } from "@/types";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    role: z.enum(["warehouse_staff", "purchase_manager"]),
    companyName: z.string().min(2, "Company/Warehouse Name is required"),
    employeeId: z.string().min(2, "Employee ID is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const roleOptions: { value: "warehouse_staff" | "purchase_manager"; label: string; description: string }[] = [
  { value: "warehouse_staff", label: "Warehouse Staff", description: "Scan items in/out & update stock" },
  { value: "purchase_manager", label: "Purchase Manager", description: "Manage suppliers & create purchase orders" },
];

export default function RegisterPage() {
  const { register: registerUser, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto logout on mount if user is already logged in to allow clean registrations
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
  }, [isAuthenticated, logout]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "warehouse_staff" },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password") || "";

  // Password requirements checklist
  const checks = [
    { label: "At least 8 characters", met: passwordValue.length >= 8 },
    { label: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(passwordValue) },
    { label: "At least one lowercase letter (a-z)", met: /[a-z]/.test(passwordValue) },
    { label: "At least one number (0-9)", met: /[0-9]/.test(passwordValue) },
    { label: "At least one special character (e.g. !@#$%)", met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      await registerUser(
        data.name,
        data.email,
        data.password,
        data.role,
        data.companyName,
        data.employeeId
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 text-center py-6"
      >
        <div className="flex justify-center">
          <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Registration Submitted</h2>
          <p className="text-sm text-muted-foreground px-2">
            Your account has been created and is currently **Pending Approval**.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4 text-left text-xs space-y-2 text-muted-foreground leading-relaxed">
          <p>
            • **Warehouse Staff**: Registration requires Administrator approval before sign-in is allowed.
          </p>
          <p>
            • **Purchase Manager**: Requires verification. An alert notification has been generated and queued for Admin approval.
          </p>
        </div>
        <div className="pt-2">
          <Button onClick={() => navigate("/login")} className="w-full">
            Back to Sign In
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-transparent overflow-hidden">
          <img src="/logo.png" alt="StockWise Logo" className="h-16 w-16 object-contain" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
          <p className="text-sm text-muted-foreground">
            Get started with StockWise inventory management
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="John Doe" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-email">Email</Label>
          <Input id="reg-email" type="email" placeholder="you@company.com" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="reg-company">Company/Warehouse</Label>
            <Input id="reg-company" placeholder="Warehouse A" {...register("companyName")} />
            {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reg-emp">Employee ID</Label>
            <Input id="reg-emp" placeholder="EMP-556" {...register("employeeId")} />
            {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Desired System Role</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value)}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all ${
                  selectedRole === role.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "hover:border-primary/50"
                }`}
              >
                <span className="text-xs font-semibold">{role.label}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{role.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reg-password">Password</Label>
          <div className="relative">
            <Input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}

          {/* Real-time Checklist */}
          {passwordValue && (
            <div className="mt-2 p-3 rounded-lg border bg-muted/20 space-y-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground">Password strength checklist:</p>
              {checks.map((chk, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  {chk.met ? (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  ) : (
                    <X className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={chk.met ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"}>
                    {chk.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Account
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
