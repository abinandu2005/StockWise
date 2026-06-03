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
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, users, logout, isAuthenticated, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  // If user arrives at login while still authenticated, clear the session
  // so the login form is always visible (they explicitly chose to come here)
  useEffect(() => {
    if (isAuthenticated) {
      logout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forgot password wizard state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "otp" | "password">("email");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [inputOtp, setInputOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError("");
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resetStep === "email") {
      if (!forgotEmail) {
        toast.error("Please enter your email address.");
        return;
      }
      const found = users.find((u: any) => u.email.toLowerCase() === forgotEmail.toLowerCase());
      if (found) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        setResetStep("otp");
        toast.success("Security verification code sent!");
        toast.info(`[DEMO ONLY] Your 6-digit security code is: ${code}`, {
          duration: 12000,
        });
      } else {
        toast.error("No account found with this email address.");
      }
    } 
    
    else if (resetStep === "otp") {
      if (!inputOtp) {
        toast.error("Please enter the verification code.");
        return;
      }
      if (inputOtp === generatedOtp) {
        setResetStep("password");
        toast.success("Security code verified successfully.");
      } else {
        toast.error("Invalid security code. Please check and try again.");
      }
    } 
    
    else if (resetStep === "password") {
      if (!newPassword) {
        toast.error("Please enter a new password.");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
      const found = users.find((u: any) => u.email.toLowerCase() === forgotEmail.toLowerCase());
      if (found) {
        updateUser(found.id, { password: newPassword });
        toast.success("Password reset completed successfully. Please sign in.");
        setForgotOpen(false);
        // Reset states
        setResetStep("email");
        setForgotEmail("");
        setInputOtp("");
        setNewPassword("");
        setConfirmPassword("");
      }
    }
  };

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
              onClick={() => {
                setForgotEmail("");
                setResetStep("email");
                setInputOtp("");
                setNewPassword("");
                setConfirmPassword("");
                setForgotOpen(true);
              }}
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

      {/* Demo credentials */}
      <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Demo Login</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setValue("email", "admin@stockwise.com");
              setValue("password", "admin123");
              toast.success("Filled Admin credentials");
            }}
            className="text-xs py-1.5 h-auto font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            Admin
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setValue("email", "staff@stockwise.com");
              setValue("password", "staff123");
              toast.success("Filled Staff credentials");
            }}
            className="text-xs py-1.5 h-auto font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            Staff
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setValue("email", "manager@stockwise.com");
              setValue("password", "manager123");
              toast.success("Filled Manager credentials");
            }}
            className="text-xs py-1.5 h-auto font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all"
          >
            Manager
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground">
          Click any role to autofill its demo credentials instantly.
        </p>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </p>

      {/* Secure Forgot Password OTP Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {resetStep === "email" && "Enter your email address to verify your identity and generate a security reset code."}
              {resetStep === "otp" && "Enter the 6-digit verification code sent to your email to authorize the password reset."}
              {resetStep === "password" && "Create a secure, strong new password for your StockWise profile."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 pt-2">
            {resetStep === "email" && (
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email Address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="user@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
            )}

            {resetStep === "otp" && (
              <div className="space-y-2">
                <Label htmlFor="otp-code">6-Digit Verification Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={inputOtp}
                  onChange={(e) => setInputOtp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            )}

            {resetStep === "password" && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pwd">Confirm New Password</Label>
                  <Input
                    id="confirm-pwd"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {resetStep === "email" && "Send Security Code"}
                {resetStep === "otp" && "Verify Code"}
                {resetStep === "password" && "Reset Password"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
