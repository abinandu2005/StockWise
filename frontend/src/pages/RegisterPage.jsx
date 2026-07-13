import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { authApi, post } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, CheckCircle2, Check, X, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";

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
    phoneNumber: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

const roleOptions = [
  { value: "warehouse_staff", label: "Warehouse Staff", description: "Scan items in/out & update stock" },
  { value: "purchase_manager", label: "Purchase Manager", description: "Manage suppliers & create purchase orders" },
];

// ── OTP Verification Step ────────────────────────────────────
function OtpVerificationStep({ email, onSuccess }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setIsVerifying(true);
    setError("");
    try {
      await authApi.verifyEmail(email, code);
      // Notify admin that a new user is pending approval
      try {
        await post("/notifications", {
          title: "New Registration Pending Approval",
          message: `User ${email} has verified their email and is awaiting admin approval to access the system.`,
          type: "warning",
          read: false,
        });
      } catch {
        // Best-effort — don't block success if notification fails
      }
      onSuccess();
    } catch (err) {
      setError(err.message || "Invalid or expired OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setError("");
    try {
      await authApi.resendOtp(email);
      toast.success("A new OTP has been sent to your email.");
      setCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err.message || "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Verify your email</h2>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (inputRefs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            className={`h-12 w-11 rounded-lg border text-center text-xl font-bold
              bg-background transition-all outline-none
              ${digit ? "border-primary ring-1 ring-primary/30" : "border-input"}
              focus:border-primary focus:ring-1 focus:ring-primary/40`}
          />
        ))}
      </div>

      <Button
        onClick={handleVerify}
        className="w-full"
        disabled={isVerifying || otp.join("").length < 6}
      >
        {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Email
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {"Didn't receive the code? "}
        <button
          onClick={handleResend}
          disabled={isResending || cooldown > 0}
          className="text-primary hover:underline font-medium disabled:opacity-50 disabled:no-underline inline-flex items-center gap-1"
        >
          {isResending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
        </button>
      </p>
    </motion.div>
  );
}

// ── Success Step ─────────────────────────────────────────────
function SuccessStep() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 text-center py-2"
    >
      <div className="flex justify-center">
        <CheckCircle2 className="h-16 w-16 text-green-500" />
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Email Verified!</h2>
        <p className="text-sm text-muted-foreground px-2">
          Your email address has been confirmed successfully.
        </p>
      </div>

      {/* Two-step info */}
      <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold dark:bg-green-900/30 dark:text-green-400">✓</span>
          <div>
            <p className="font-medium">Email Verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your email has been confirmed.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold dark:bg-amber-900/30 dark:text-amber-400">2</span>
          <div>
            <p className="font-medium">Pending Admin Approval</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              An administrator must activate your account before you can sign in. You will be notified once approved.
            </p>
          </div>
        </div>
      </div>

      <Button onClick={() => navigate("/login")} className="w-full">
        Back to Sign In
      </Button>
    </motion.div>
  );
}


// ── Main Registration Form ────────────────────────────────────
export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // "form" | "otp" | "success"
  const [registeredEmail, setRegisteredEmail] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "warehouse_staff" },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password") || "";

  const checks = [
    { label: "At least 8 characters", met: passwordValue.length >= 8 },
    { label: "At least one uppercase letter (A-Z)", met: /[A-Z]/.test(passwordValue) },
    { label: "At least one lowercase letter (a-z)", met: /[a-z]/.test(passwordValue) },
    { label: "At least one number (0-9)", met: /[0-9]/.test(passwordValue) },
    { label: "At least one special character (e.g. !@#$%)", met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  const onSubmit = async (data) => {
    try {
      setError("");
      await registerUser(data.name, data.email, data.password, data.role, data.phoneNumber);
      setRegisteredEmail(data.email);
      setStep("otp");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  if (step === "otp") {
    return (
      <OtpVerificationStep
        email={registeredEmail}
        onSuccess={() => setStep("success")}
      />
    );
  }

  if (step === "success") {
    return <SuccessStep />;
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

        <div className="space-y-2">
          <Label htmlFor="reg-phone">Phone Number (optional)</Label>
          <Input id="reg-phone" type="tel" placeholder="+91 98765 43210" {...register("phoneNumber")} />
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
