import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useGoogleLogin } from "@react-oauth/google";
import {
  ArrowRight,
  Briefcase,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
  Wrench,
  CheckCircle2
} from "lucide-react";
import { Button } from "../components/ui/Button.jsx";
import { Card, Badge } from "../components/ui/Card.jsx";
import { skills } from "../data/demoData.js";
import { useJeevikaStore } from "../lib/store.js";
import { authApi, saveToken } from "../lib/api.js";
import { compressImage } from "../lib/imageUtils.js";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const googleConfigured = GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes("your_google");

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

function GoogleButton({ label = "Sign up with Google" }) {
  const { loginWithUser } = useJeevikaStore();
  const navigate = useNavigate();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const { token, user } = await authApi.googleAuth({
          credential: tokenResponse.access_token,
          flow: "implicit"
        });
        saveToken(token);
        loginWithUser(user);
        toast.success(`Welcome, ${user.name?.split(" ")[0] || "there"}!`);
        navigate("/dashboard");
      } catch (err) {
        toast.error(err.message || "Google sign-in failed.");
      }
    },
    onError: () => toast.error("Google sign-in was cancelled or failed."),
    flow: "implicit"
  });

  if (!googleConfigured) {
    return (
      <button
        type="button"
        onClick={() => toast.info("Add VITE_GOOGLE_CLIENT_ID to .env.local to enable Google sign-up")}
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

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 })
};

const roles = [
  { id: "worker", label: "Worker", hint: "Find jobs in labor, farm, repair, or household", icon: Wrench, color: "emerald" },
  { id: "employer", label: "Employer", hint: "Hire workers, rent equipment, buy materials", icon: Briefcase, color: "violet" }
];

export function RegisterPage() {
  const { loginWithUser } = useJeevikaStore();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("");
  const [step, setStep] = useState(0); // 0 = role selection, 1 = form
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [profilePreview, setProfilePreview] = useState(null);
  const [idProofPreview, setIdProofPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Worker fields
  const [workerForm, setWorkerForm] = useState({
    fullName: "", email: "", phone: "", skills: [], experience: "",
    location: "", upiId: "", password: "", confirmPassword: ""
  });

  // Employer fields
  const [employerForm, setEmployerForm] = useState({
    fullName: "", companyName: "", phone: "", email: "",
    upiId: "", location: "", password: "", confirmPassword: ""
  });

  const form = selectedRole === "worker" ? workerForm : employerForm;
  const setForm = selectedRole === "worker" ? setWorkerForm : setEmployerForm;

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleSkill = (skill) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    if (errors.skills) setErrors((prev) => ({ ...prev, skills: "" }));
  };

  const handleProfilePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result);
        setProfilePreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdProof = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const compressed = await compressImage(ev.target.result, 1200, 0.6); // ID proof can be slightly larger for legibility
        setIdProofPreview(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const goToForm = (roleId) => {
    setSelectedRole(roleId);
    setDirection(1);
    setStep(1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(0);
    setErrors({});
  };

  // OTP cooldown timer
  const startCooldown = () => {
    setOtpCooldown(60);
    const timer = setInterval(() => {
      setOtpCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  // Normalize phone: remove spaces/dashes, ensure no duplicate +91
  const normalizePhone = (raw) => {
    let cleaned = raw.replace(/[\s\-]/g, "");
    // If user typed +91 twice or it's missing, normalize
    if (!cleaned.startsWith("+91") && /^[6-9]\d{9}$/.test(cleaned)) {
      cleaned = "+91" + cleaned;
    }
    return cleaned;
  };

  const handleSendOtp = async () => {
    const phone = normalizePhone(form.phone);
    if (!phone || phone.length < 10) { setErrors(p => ({ ...p, phone: "Enter phone number first" })); return; }
    if (!/^\+91[6-9]\d{9}$/.test(phone)) { setErrors(p => ({ ...p, phone: "Enter a valid Indian mobile number" })); return; }

    setOtpLoading(true);
    setErrors(p => ({ ...p, phone: "" }));
    try {
      await authApi.sendOtp(phone);
      setOtpSent(true);
      startCooldown();
      toast.success("OTP sent! Check your server terminal for the code.");
    } catch (err) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const phone = normalizePhone(form.phone);
    if (!otpValue || otpValue.length !== 6) { toast.error("Enter the 6-digit OTP"); return; }

    setOtpLoading(true);
    try {
      await authApi.verifyOtp(phone, otpValue);
      setOtpVerified(true);
      toast.success("Phone number verified!");
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter a valid email";
    }
    if (!form.phone.trim()) e.phone = "Mobile number is required";
    else if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(form.phone.replace(/\s/g, "")))
      e.phone = "Enter a valid Indian mobile number";
    if (!otpVerified) e.phone = "Please verify your phone number with OTP";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.upiId.trim()) e.upiId = "UPI ID is required";
    if (!form.password) e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Minimum 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";

    if (selectedRole === "worker") {
      if (selectedSkills.length === 0) e.skills = "Select at least one skill";
      if (!form.experience.trim()) e.experience = "Experience is required";
    }
    if (selectedRole === "employer") {
      if (!form.companyName.trim()) e.companyName = "Company/Individual name is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      const payload = {
        name: form.fullName,
        email: form.email || undefined,
        phone: normalizePhone(form.phone),
        password: form.password,
        role: selectedRole,
        location: form.location,
        upi: form.upiId,
        ...(selectedRole === "worker" && {
          skills: selectedSkills,
          experience: form.experience,
          profilePhoto: profilePreview || undefined,
          idProof: idProofPreview || undefined
        }),
        ...(selectedRole === "employer" && {
          companyName: form.companyName
        })
      };

      const { token, user } = await authApi.register(payload);
      saveToken(token);
      loginWithUser(user);
      toast.success(`Account created! Welcome to Jeevika, ${user.name?.split(" ")[0]}.`);
      navigate("/dashboard");
    } catch (err) {
      if (err.field) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message }));
        // Scroll back to show the error
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render a field (plain function, NOT a component — avoids remount/focus-loss on each keystroke)
  const renderField = (label, field, { type = "text", icon: Icon, placeholder, ...rest } = {}) => (
    <label key={field} className="grid gap-2 text-sm font-semibold">
      {label}
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
        <input
          id={`register-${field}`}
          type={type}
          className={`field ${Icon ? "pl-11" : ""} ${errors[field] ? "border-red-500/60" : ""}`}
          placeholder={placeholder}
          value={form[field]}
          onChange={(ev) => updateField(field, ev.target.value)}
          {...rest}
        />
      </div>
      {errors[field] && <span className="text-xs text-red-400">{errors[field]}</span>}
    </label>
  );

  return (
    <div className="min-h-screen bg-jeevika-hero text-foreground">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-emerald-500/8 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-violet-500/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <Motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }} className="mb-8">
          <Link to="/" className="mb-6 inline-flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-emerald-300 to-violet-500 font-black text-slate-950">
              J
            </div>
            <div>
              <p className="font-black">Jeevika</p>
              <p className="text-xs text-slate-400">Building Trust in Work</p>
            </div>
          </Link>
        </Motion.div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 ? (
            /* ========== STEP 0: ROLE SELECTION ========== */
            <Motion.div
              key="role-select"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="mx-auto max-w-2xl"
            >
              <div className="mb-8 text-center">
                <Badge tone="emerald"><Sparkles className="mr-1 h-3 w-3" /> Create Account</Badge>
                <h1 className="mt-4 text-4xl font-black sm:text-5xl">
                  <span className="gradient-text">How Will You Use Jeevika?</span>
                </h1>
                <p className="mt-4 text-slate-400">Choose your role to get started. This determines your dashboard experience.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => goToForm(role.id)}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-left transition-all duration-300 hover:border-emerald-400/30 hover:bg-white/8 hover:shadow-glow"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/5 to-violet-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative">
                      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl ${role.color === "emerald" ? "bg-emerald-500/10" : "bg-violet-500/10"}`}>
                        <role.icon className={`h-7 w-7 ${role.color === "emerald" ? "text-emerald-400" : "text-violet-400"}`} />
                      </div>
                      <h3 className="text-xl font-black">{role.label}</h3>
                      <p className="mt-2 text-sm text-slate-400">{role.hint}</p>
                      <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-primary">
                        Get started <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary hover:text-emerald-300">Sign In</Link>
              </p>
            </Motion.div>
          ) : (
            /* ========== STEP 1: REGISTRATION FORM ========== */
            <Motion.div
              key="form"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 flex items-center gap-4">
                <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-colors hover:bg-white/10">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm text-slate-400">Registering as</p>
                  <h2 className="text-xl font-black">{selectedRole === "worker" ? "Worker" : "Employer"}</h2>
                </div>
              </div>

              <Card className="relative overflow-hidden rounded-3xl p-8 sm:p-10">
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${selectedRole === "worker" ? "from-emerald-400 to-sky-400" : "from-violet-400 to-rose-400"}`} />

                <form onSubmit={handleSubmit} className="grid gap-6">
                  {selectedRole === "worker" ? (
                    /* ===== WORKER FORM ===== */
                    <>
                      {/* Profile Photo */}
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5">
                            {profilePreview ? (
                              <img src={profilePreview} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                              <Camera className="h-6 w-6 text-slate-500" />
                            )}
                          </div>
                          <input type="file" accept="image/*" onChange={handleProfilePhoto} className="absolute inset-0 cursor-pointer opacity-0" />
                        </div>
                        <div>
                          <p className="font-semibold">Profile Photo</p>
                          <p className="text-sm text-slate-400">Click to upload (optional)</p>
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        {renderField("Full Name", "fullName", { icon: User, placeholder: "e.g. Asha Jadhav" })}
                        {renderField("Email (Optional)", "email", { type: "email", icon: Mail, placeholder: "you@example.com" })}
                        {/* Phone + OTP verification */}
                        <label className="grid gap-2 text-sm font-semibold">
                          Mobile Number
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="tel"
                              className={`field pl-11 pr-28 ${errors.phone ? "border-red-500/60" : otpVerified ? "border-emerald-500/60" : ""}`}
                              placeholder="+91 98765 43210"
                              value={form.phone}
                              onChange={(ev) => { updateField("phone", ev.target.value); setOtpVerified(false); setOtpSent(false); setOtpValue(""); }}
                              disabled={otpVerified}
                            />
                            {otpVerified ? (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" /> Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={otpLoading || otpCooldown > 0}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/30 transition disabled:opacity-50"
                              >
                                {otpLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                              </button>
                            )}
                          </div>
                          {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
                        </label>
                        {/* OTP Input - shown after OTP is sent */}
                        {otpSent && !otpVerified && (
                          <div className="sm:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-5">
                            <label className="grid gap-3 text-sm font-semibold">
                              <div className="flex items-center justify-between">
                                <span>Enter 6-digit OTP</span>
                                <span className="text-xs text-slate-500">Sent to {form.phone}</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  className="field text-center text-2xl font-black tracking-[0.5em] flex-1 h-14"
                                  placeholder="● ● ● ● ● ●"
                                  value={otpValue}
                                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  disabled={otpLoading || otpValue.length !== 6}
                                  className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition disabled:opacity-50 h-14"
                                >
                                  {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">Check your server terminal for the OTP code</p>
                                {otpCooldown > 0 ? (
                                  <p className="text-xs text-slate-500">Resend in <span className="font-bold text-primary">{otpCooldown}s</span></p>
                                ) : (
                                  <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-primary hover:text-emerald-300 transition">
                                    Resend OTP
                                  </button>
                                )}
                              </div>
                            </label>
                          </div>
                        )}
                        {renderField("Experience", "experience", { icon: Briefcase, placeholder: "e.g. 5 years painting" })}
                        {renderField("Location", "location", { icon: MapPin, placeholder: "Kolhapur, Maharashtra" })}
                        {renderField("UPI ID", "upiId", { icon: Wallet, placeholder: "yourname@upi" })}
                      </div>

                      {/* ID Proof */}
                      <div className="flex items-center gap-5">
                        <div className="relative">
                          <div className="flex h-20 w-32 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5">
                            {idProofPreview ? (
                              <img src={idProofPreview} alt="ID Proof" className="h-full w-full object-cover" />
                            ) : (
                              <ShieldCheck className="h-6 w-6 text-slate-500" />
                            )}
                          </div>
                          <input type="file" accept="image/*" onChange={handleIdProof} className="absolute inset-0 cursor-pointer opacity-0" />
                        </div>
                        <div>
                          <p className="font-semibold">ID Proof (Aadhaar/Voter)</p>
                          <p className="text-sm text-slate-400">Secure upload for verification</p>
                        </div>
                      </div>

                      {/* Skills Selection */}
                      <div>
                        <p className="mb-3 text-sm font-semibold">
                          Skills <span className="text-slate-500">(select all that apply)</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill) => (
                            <button type="button" key={skill} onClick={() => toggleSkill(skill)}>
                              <Badge tone={selectedSkills.includes(skill) ? "emerald" : "violet"}>
                                {selectedSkills.includes(skill) && <span className="mr-1">✓</span>}
                                {skill}
                              </Badge>
                            </button>
                          ))}
                        </div>
                        {errors.skills && <span className="mt-1 text-xs text-red-400">{errors.skills}</span>}
                      </div>

                      {/* Passwords */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          Password
                          <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              className={`field pl-11 pr-11 ${errors.password ? "border-red-500/60" : ""}`}
                              placeholder="Min 6 characters"
                              value={form.password}
                              onChange={(e) => updateField("password", e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Confirm Password
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="register-confirm-password"
                              type={showPassword ? "text" : "password"}
                              className={`field pl-11 ${errors.confirmPassword ? "border-red-500/60" : ""}`}
                              placeholder="Re-enter password"
                              value={form.confirmPassword}
                              onChange={(e) => updateField("confirmPassword", e.target.value)}
                            />
                          </div>
                          {errors.confirmPassword && <span className="text-xs text-red-400">{errors.confirmPassword}</span>}
                        </label>
                      </div>
                    </>
                  ) : (
                    /* ===== EMPLOYER FORM ===== */
                    <>
                      <div className="grid gap-5 sm:grid-cols-2">
                        {renderField("Full Name", "fullName", { icon: User, placeholder: "e.g. Suresh Patil" })}
                        {renderField("Company / Individual Name", "companyName", { icon: Briefcase, placeholder: "e.g. Patil Farms" })}
                        {/* Phone + OTP verification */}
                        <label className="grid gap-2 text-sm font-semibold">
                          Mobile Number
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              type="tel"
                              className={`field pl-11 pr-28 ${errors.phone ? "border-red-500/60" : otpVerified ? "border-emerald-500/60" : ""}`}
                              placeholder="+91 98765 43210"
                              value={form.phone}
                              onChange={(ev) => { updateField("phone", ev.target.value); setOtpVerified(false); setOtpSent(false); setOtpValue(""); }}
                              disabled={otpVerified}
                            />
                            {otpVerified ? (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-emerald-400">
                                <CheckCircle2 className="h-4 w-4" /> Verified
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={otpLoading || otpCooldown > 0}
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/30 transition disabled:opacity-50"
                              >
                                {otpLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
                              </button>
                            )}
                          </div>
                          {errors.phone && <span className="text-xs text-red-400">{errors.phone}</span>}
                        </label>
                        {/* OTP Input - shown after OTP is sent */}
                        {otpSent && !otpVerified && (
                          <div className="sm:col-span-2 rounded-2xl bg-white/5 border border-white/10 p-5">
                            <label className="grid gap-3 text-sm font-semibold">
                              <div className="flex items-center justify-between">
                                <span>Enter 6-digit OTP</span>
                                <span className="text-xs text-slate-500">Sent to {form.phone}</span>
                              </div>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  maxLength={6}
                                  className="field text-center text-2xl font-black tracking-[0.5em] flex-1 h-14"
                                  placeholder="● ● ● ● ● ●"
                                  value={otpValue}
                                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  disabled={otpLoading || otpValue.length !== 6}
                                  className="rounded-xl bg-emerald-500 px-6 py-2 text-sm font-bold text-white hover:bg-emerald-600 transition disabled:opacity-50 h-14"
                                >
                                  {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-slate-500">Check your server terminal for the OTP code</p>
                                {otpCooldown > 0 ? (
                                  <p className="text-xs text-slate-500">Resend in <span className="font-bold text-primary">{otpCooldown}s</span></p>
                                ) : (
                                  <button type="button" onClick={handleSendOtp} className="text-xs font-bold text-primary hover:text-emerald-300 transition">
                                    Resend OTP
                                  </button>
                                )}
                              </div>
                            </label>
                          </div>
                        )}
                        {renderField("Email (Optional)", "email", { type: "email", icon: Mail, placeholder: "you@example.com" })}
                        {renderField("UPI ID", "upiId", { icon: Wallet, placeholder: "business@upi" })}
                        {renderField("Location", "location", { icon: MapPin, placeholder: "Kolhapur, Maharashtra" })}
                      </div>

                      {/* Passwords */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <label className="grid gap-2 text-sm font-semibold">
                          Password
                          <div className="relative">
                            <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="register-password"
                              type={showPassword ? "text" : "password"}
                              className={`field pl-11 pr-11 ${errors.password ? "border-red-500/60" : ""}`}
                              placeholder="Min 6 characters"
                              value={form.password}
                              onChange={(e) => updateField("password", e.target.value)}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
                        </label>
                        <label className="grid gap-2 text-sm font-semibold">
                          Confirm Password
                          <div className="relative">
                            <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                              id="register-confirm-password"
                              type={showPassword ? "text" : "password"}
                              className={`field pl-11 ${errors.confirmPassword ? "border-red-500/60" : ""}`}
                              placeholder="Re-enter password"
                              value={form.confirmPassword}
                              onChange={(e) => updateField("confirmPassword", e.target.value)}
                            />
                          </div>
                          {errors.confirmPassword && <span className="text-xs text-red-400">{errors.confirmPassword}</span>}
                        </label>
                      </div>
                    </>
                  )}

                  {/* Terms */}
                  <label className="flex items-start gap-3 text-sm text-slate-400">
                    <input type="checkbox" className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 accent-primary" />
                    <span>
                      I agree to the{" "}
                      <button type="button" className="text-primary hover:underline">Terms of Service</button>
                      {" "}and{" "}
                      <button type="button" className="text-primary hover:underline">Privacy Policy</button>
                    </span>
                  </label>

                  {/* Submit */}
                  <Button className="w-full sm:w-auto" disabled={isLoading}>
                    {isLoading ? (
                      <Motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-5 w-5 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
                      />
                    ) : (
                      <>
                        Create {selectedRole === "worker" ? "Worker" : "Employer"} Account <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-xs text-slate-500">OR</span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>

                  {/* Google */}
                  <GoogleButton />

                  <p className="text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link to="/login" className="font-semibold text-primary hover:text-emerald-300">Sign In</Link>
                  </p>
                </form>
              </Card>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
