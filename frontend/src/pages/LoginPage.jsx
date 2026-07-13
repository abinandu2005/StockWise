import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { authApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, KeyRound, Lock, RefreshCw, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// ── OTP Boxes for forgot-password dialog ────────────────────
function OtpBoxes({ value, onChange }) {
  const digits = value.split("").concat(Array(6).fill("")).slice(0, 6);
  const refs = useRef([]);

  const handleChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    onChange(next.join(""));
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      onChange(pasted);
      refs.current[5]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {digits.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (refs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          className={`h-11 w-10 rounded-lg border text-center text-lg font-bold
            bg-background transition-all outline-none
            ${digit ? "border-primary ring-1 ring-primary/30" : "border-input"}
            focus:border-primary focus:ring-1 focus:ring-primary/40`}
        />
      ))}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  // ── Forgot password dialog state ──────────────────────────
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetStep, setResetStep] = useState("email"); // email | otp | password | done
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  // Cooldown timer for resend OTP
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

  const openForgot = () => {
    setForgotEmail("");
    setForgotOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setFpError("");
    setResetStep("email");
    setCooldown(0);
    setForgotOpen(true);
  };

  const closeForgot = () => setForgotOpen(false);

  // Step 1 — send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!forgotEmail) { setFpError("Please enter your email address."); return; }
    setFpLoading(true);
    setFpError("");
    try {
      await authApi.forgotPassword(forgotEmail);
      toast.success("OTP sent! Check your email.");
      setCooldown(60);
      setResetStep("otp");
    } catch (err) {
      setFpError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // Resend OTP (from OTP step)
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setFpLoading(true);
    setFpError("");
    try {
      await authApi.forgotPassword(forgotEmail);
      toast.success("A new OTP has been sent.");
      setCooldown(60);
      setForgotOtp("");
    } catch (err) {
      setFpError(err.message || "Failed to resend OTP.");
    } finally {
      setFpLoading(false);
    }
  };

  // Step 2 — verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (forgotOtp.length < 6) { setFpError("Please enter all 6 digits."); return; }
    setFpLoading(true);
    setFpError("");
    try {
      await authApi.verifyForgotPasswordOtp(forgotEmail, forgotOtp);
      setResetStep("password");
    } catch (err) {
      setFpError(err.message || "Invalid or expired OTP. Please try again.");
      setForgotOtp("");
    } finally {
      setFpLoading(false);
    }
  };

  // Step 3 — reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setFpError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setFpError("Passwords do not match."); return; }
    setFpLoading(true);
    setFpError("");
    try {
      await authApi.resetPassword(forgotEmail, forgotOtp, newPassword);
      setResetStep("done");
    } catch (err) {
      setFpError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setError("");
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  // ── Forgot dialog step meta ───────────────────────────────
  const stepMeta = {
    email:    { icon: <Mail className="h-6 w-6" />,        title: "Forgot Password",     desc: "Enter your registered email and we'll send you a reset code." },
    otp:      { icon: <KeyRound className="h-6 w-6" />,    title: "Enter Reset Code",    desc: `Enter the 6-digit OTP sent to ${forgotEmail}` },
    password: { icon: <Lock className="h-6 w-6" />,        title: "Set New Password",    desc: "Create a strong new password for your account." },
    done:     { icon: <CheckCircle2 className="h-6 w-6" />, title: "Password Reset!",    desc: "Your password has been changed. You can now sign in." },
  };
  const meta = stepMeta[resetStep];

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
          <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            Sign in to your StockWise account
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@stockwise.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={openForgot}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Sign in
        </Button>
      </form>


      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>

      {/* ── Forgot Password Dialog ─────────────────────────────── */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0
                ${resetStep === "done" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-primary/10 text-primary"}`}>
                {meta.icon}
              </div>
              <div>
                <DialogTitle className="text-left">{meta.title}</DialogTitle>
                <DialogDescription className="text-left text-xs mt-0.5">
                  {meta.desc}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Step indicators */}
          {resetStep !== "done" && (
            <div className="flex items-center gap-1 mb-2">
              {["email", "otp", "password"].map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div className={`h-1.5 w-full rounded-full transition-all ${
                    ["email", "otp", "password"].indexOf(resetStep) >= i
                      ? "bg-primary" : "bg-muted"}`} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {fpError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {fpError}
            </div>
          )}

          {/* Step 1: Email */}
          {resetStep === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Registered Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="you@company.com"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setFpError(""); }}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForgot}>Cancel</Button>
                <Button type="submit" disabled={fpLoading || !forgotEmail}>
                  {fpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Send OTP
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: OTP */}
          {resetStep === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-3">
                <Label className="text-center block text-sm">6-Digit Reset Code</Label>
                <OtpBoxes value={forgotOtp} onChange={(val) => { setForgotOtp(val); setFpError(""); }} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForgot}>Cancel</Button>
                <Button type="submit" disabled={fpLoading || forgotOtp.length < 6}>
                  {fpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify Code
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {"Didn't get the code? "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={fpLoading || cooldown > 0}
                  className="text-primary hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend OTP"}
                </button>
              </p>
            </form>
          )}

          {/* Step 3: New Password */}
          {resetStep === "password" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setFpError(""); }}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFpError(""); }}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeForgot}>Cancel</Button>
                <Button type="submit" disabled={fpLoading || !newPassword || !confirmPassword}>
                  {fpLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Done */}
          {resetStep === "done" && (
            <div className="space-y-4 text-center py-2">
              <p className="text-sm text-muted-foreground">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button className="w-full" onClick={closeForgot}>
                Back to Sign In
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
