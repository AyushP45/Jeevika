import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Card, Badge } from "../components/ui/Card.jsx";
import { useJeevikaStore } from "../lib/store.js";
import { authApi, saveToken } from "../lib/api.js";

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const googleConfigured = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("your_google");

// ─── Forgot Password Modal ──────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("input"); // "input" | "sent"
  const [method, setMethod] = useState("email");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!value.trim()) {
      setError(`${method === "email" ? "Email" : "Mobile number"} is required`);
      return false;
    }
    if (method === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address");
      return false;
    }
    if (method === "phone" && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(value.replace(/\s/g, ""))) {
      setError("Enter a valid Indian mobile number");
      return false;
    }
    return true;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = method === "email" ? { email: value } : { phone: value };
      await authApi.forgotPassword(payload);
      setStep("sent");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      <Motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md"
      >
        <Card className="relative overflow-hidden rounded-3xl p-8">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 to-violet-500" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {step === "input" ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-black">Reset Password</h2>
                <p className="mt-1 text-sm text-slate-400">
                  We'll send you a reset link to your registered contact.
                </p>
              </div>

              {/* Method toggle */}
              <div className="mb-5 flex rounded-xl bg-white/5 p-1">
                {[
                  { id: "email", label: "Email", icon: Mail },
                  { id: "phone", label: "Mobile", icon: Phone }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { setMethod(m.id); setValue(""); setError(""); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                      method === m.id ? "bg-primary/15 text-primary" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSend} className="grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  {method === "email" ? "Email Address" : "Mobile Number"}
                  <div className="relative">
                    {method === "email"
                      ? <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      : <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    }
                    <input
                      id="forgot-input"
                      type={method === "email" ? "email" : "tel"}
                      className={`field pl-11 ${error ? "border-red-500/60" : ""}`}
                      placeholder={method === "email" ? "you@example.com" : "+91 98765 43210"}
                      value={value}
                      onChange={(e) => { setValue(e.target.value); setError(""); }}
                      autoFocus
                    />
                  </div>
                  {error && <span className="text-xs text-red-400">{error}</span>}
                </label>

                <Button className="w-full" disabled={loading}>
                  {loading ? (
                    <Motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                    />
                  ) : (
                    <><Send className="h-4 w-4" /> Send Reset Link</>
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <div className="py-4 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-black">Check your {method === "email" ? "inbox" : "messages"}!</h2>
              <p className="mx-auto mt-3 max-w-xs text-sm text-slate-400">
                {method === "email"
                  ? `We've sent a password reset link to ${value}. Check your inbox and spam folder.`
                  : `We've sent a reset OTP to ${value}. It expires in 10 minutes.`}
              </p>
              <Button className="mt-6" onClick={onClose}>
                Back to Login
              </Button>
            </div>
          )}
        </Card>
      </Motion.div>
    </Motion.div>
  );
}

// ─── Google Button ──────────────────────────────────────────────────────────
function GoogleButton({ onSuccess, label = "Continue with Google" }) {
  const { loginWithUser } = useJeevikaStore();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      // For @react-oauth/google implicit flow, we get an access_token
      // We send it to backend to verify and create/find user
      const { token, user } = await authApi.googleAuth({ 
        credential: tokenResponse.access_token,
        flow: "implicit"
      });
      saveToken(token);
      loginWithUser(user);
      toast.success(`Welcome, ${user.name?.split(" ")[0] || "there"}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Google sign-in failed. Please try again.");
    }
  };

  // Use credential flow (ID token) via One Tap
  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => toast.error("Google sign-in was cancelled or failed."),
    flow: "implicit"
  });

  if (!googleConfigured) {
    return (
      <button
        type="button"
        onClick={() => toast.info("Google OAuth requires a Client ID. Add VITE_GOOGLE_CLIENT_ID to .env.local")}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition-all hover:bg-white/10"
      >
        <GoogleIcon />
        {label}
        <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">Setup needed</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => googleLogin()}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
    >
      <GoogleIcon />
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ─── Main Login Page ────────────────────────────────────────────────────────
export function LoginPage() {
  const { loginWithUser } = useJeevikaStore();
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState("phone");
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [formData, setFormData] = useState({ email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const update = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (loginMethod === "email") {
      if (!formData.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = "Enter a valid email";
    } else {
      if (!formData.phone.trim()) e.phone = "Mobile number is required";
      else if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(formData.phone.replace(/\s/g, "")))
        e.phone = "Enter a valid Indian mobile number";
    }
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 6) e.password = "Minimum 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload = loginMethod === "email"
        ? { email: formData.email, password: formData.password }
        : { phone: formData.phone, password: formData.password };
      const { token, user } = await authApi.login(payload);
      saveToken(token);
      loginWithUser(user);
      toast.success(`Welcome back, ${user.name?.split(" ")[0] || "there"}!`);
      navigate("/dashboard");
    } catch (err) {
      if (err.field === "email" || err.field === "phone") {
        setErrors({ [err.field]: err.message });
      } else {
        toast.error(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-jeevika-hero text-foreground">
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-500/8 blur-[120px]" />
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
      </AnimatePresence>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
        <div className="grid w-full gap-12 lg:grid-cols-2 lg:gap-16">

          {/* Left — Branding */}
          <Motion.div
            initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <Link to="/" className="mb-8 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-500 text-lg font-black text-slate-950">J</div>
              <div>
                <p className="text-xl font-black">Jeevika</p>
                <p className="text-xs text-slate-400">Building Trust in Work</p>
              </div>
            </Link>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl">
              <span className="gradient-text">Welcome Back</span>
            </h1>
            <p className="mt-4 max-w-md text-lg leading-8 text-slate-300">
              Log in to your account to find jobs, hire workers, manage escrow, and grow your trusted reputation.
            </p>
            <div className="mt-10 space-y-4">
              {[
                { icon: ShieldCheck, text: "Your data is encrypted and secure" },
                { icon: Sparkles, text: "Instant access to nearby jobs and workers" },
                { icon: KeyRound, text: "Verified identity and trust badges" }
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                    <item.icon className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="text-sm text-slate-400">{item.text}</span>
                </div>
              ))}
            </div>
          </Motion.div>

          {/* Right — Form */}
          <Motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-10">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-primary to-violet-500" />

              <div className="mb-8">
                <h2 className="text-2xl font-black">Sign In</h2>
                <p className="mt-1 text-sm text-slate-400">Enter your credentials to access your account</p>
              </div>

              {/* Method toggle */}
              <div className="mb-6 flex rounded-xl bg-white/5 p-1">
                {[{ id: "phone", label: "Mobile", icon: Phone }, { id: "email", label: "Email", icon: Mail }].map((m) => (
                  <button
                    key={m.id} type="button"
                    onClick={() => setLoginMethod(m.id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                      loginMethod === m.id ? "bg-primary/15 text-primary shadow-sm" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    {m.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5">
                {/* Email / Phone */}
                {loginMethod === "email" ? (
                  <label className="grid gap-2 text-sm font-semibold">
                    Email Address
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input id="login-email" type="email" className={`field pl-11 ${errors.email ? "border-red-500/60" : ""}`}
                        placeholder="you@example.com" value={formData.email} onChange={(e) => update("email", e.target.value)} />
                    </div>
                    {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
                  </label>
                ) : (
                  <label className="grid gap-2 text-sm font-semibold">
                    Mobile Number
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input id="login-phone" type="tel" className={`field pl-11 ${errors.phone ? "border-red-500/60" : ""}`}
                        placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => update("phone", e.target.value)} />
                    </div>
                    {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
                  </label>
                )}

                {/* Password */}
                <label className="grid gap-2 text-sm font-semibold">
                  Password
                  <div className="relative">
                    <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input id="login-password" type={showPassword ? "text" : "password"}
                      className={`field pl-11 pr-11 ${errors.password ? "border-red-500/60" : ""}`}
                      placeholder="Enter your password" value={formData.password} onChange={(e) => update("password", e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
                </label>

                {/* Remember + Forgot */}
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-400">
                    <input type="checkbox" className="h-4 w-4 rounded border-white/20 bg-white/5 accent-primary" />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="font-semibold text-primary transition-colors hover:text-emerald-300"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit */}
                <Button className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <Motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                  ) : (
                    <>Sign In <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-slate-500">OR</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                {/* Google Sign In */}
                <GoogleButton label="Continue with Google" />

                {/* Sign up link */}
                <p className="text-center text-sm text-slate-400">
                  Don't have an account?{" "}
                  <Link to="/register" className="font-semibold text-primary transition-colors hover:text-emerald-300">
                    Create Account
                  </Link>
                </p>
              </form>
            </Card>
          </Motion.div>
        </div>
      </div>
    </div>
  );
}
