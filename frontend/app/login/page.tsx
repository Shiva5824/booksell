"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ShoppingBag, Mail, Lock, Phone, ArrowRight, Eye, EyeOff, User, ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { syncAuth } from "@/services/api";

type AuthMode = "landing" | "email" | "phone";
type EmailMode = "signin" | "signup";

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background text-ink">Loading...</main>}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const { user } = useAuth();

  const [mode, setMode] = useState<AuthMode>("landing");
  const [emailMode, setEmailMode] = useState<EmailMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Email form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone OTP
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.replace("/onboarding");
  }, [user, router]);

  function clearError() {
    setError("");
  }

  // ── Google ──────────────────────────────────────────────
  async function handleGoogle() {
    setLoading(true);
    clearError();
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      const syncResult = await syncAuth({
        name: result.user.displayName || "",
        avatar: result.user.photoURL || ""
      });
      if (!syncResult) {
        throw new Error("Failed to sync your profile. Please try again.");
      }
      router.replace("/onboarding");
    } catch (e: any) {
      setError(e.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Email / Password ────────────────────────────────────
  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    clearError();
    try {
      if (emailMode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        
        // Send email verification link
        await sendEmailVerification(cred.user);
        alert("A verification link has been sent to your email inbox! Please verify your email.");

        const token = await cred.user.getIdToken();
        localStorage.setItem("token", token);
        const syncResult = await syncAuth({ name: name || cred.user.displayName || "", avatar: "" });
        if (!syncResult) throw new Error("Profile sync failed. Please try again.");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const token = await cred.user.getIdToken();
        localStorage.setItem("token", token);
        const syncResult = await syncAuth();
        if (!syncResult) throw new Error("Profile sync failed. Please try again.");
      }
      router.replace("/onboarding");
    } catch (e: any) {
      const msg: Record<string, string> = {
        "auth/user-not-found": "No account found. Sign up instead?",
        "auth/wrong-password": "Incorrect password. Try again.",
        "auth/email-already-in-use": "Email already registered. Sign in instead?",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/invalid-email": "Enter a valid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(msg[e.code] || e.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Phone OTP ───────────────────────────────────────────
  async function handleSendOtp() {
    setLoading(true);
    clearError();
    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmation(result);
      setOtpSent(true);
    } catch (e: any) {
      setError(e.message || "Failed to send OTP. Check the number and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!confirmation) return;
    setLoading(true);
    clearError();
    try {
      const result = await confirmation.confirm(otp.join(""));
      const token = await result.user.getIdToken();
      localStorage.setItem("token", token);
      const syncResult = await syncAuth({ name: result.user.displayName || "User", avatar: "" });
      if (!syncResult) throw new Error("Profile sync failed. Please try again.");
      router.replace("/onboarding");
    } catch (e: any) {
      setError("Invalid OTP. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 28 } },
    exit: { opacity: 0, y: -16, scale: 0.98, transition: { duration: 0.18 } },
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow - simplified to reduce lag on mobile */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[100px] sm:bg-primary/15 sm:blur-[120px] animate-pulseGlow" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px] sm:bg-secondary/15 sm:blur-[120px] animate-pulseGlow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-white shadow-glow-primary group-hover:scale-105 transition-transform">
              <ShoppingBag size={26} />
            </div>
            <span className="text-3xl font-black tracking-tight text-gradient">SellChey</span>
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">

          {/* ─── Landing (choose method) ─── */}
          {mode === "landing" && (
            <motion.div key="landing" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-border/10 glass p-8 shadow-2xl backdrop-blur-xl">
                <h1 className="text-2xl font-black text-ink text-center mb-1">Welcome back</h1>
                <p className="text-sm text-ink-secondary text-center mb-8">Sign in to your SellChey account</p>

                {/* Google */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border/10 bg-surface-bg hover:bg-surface-glass px-5 py-4 font-bold text-ink transition-all duration-200 mb-4 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  Continue with Google
                </motion.button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/10" /></div>
                  <div className="relative flex justify-center text-xs text-ink-tertiary"><span className="bg-transparent px-3 font-semibold">or continue with</span></div>
                </div>

                <div className="mt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setMode("email"); clearError(); }}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-border/10 bg-surface-bg hover:bg-surface-glass px-5 py-4 font-bold text-ink transition-all"
                  >
                    <Mail size={18} className="text-primary animate-pulse" />
                    Continue with Email
                  </motion.button>
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 text-center">
                    {error}
                  </motion.p>
                )}

                <p className="text-center text-xs text-ink-tertiary mt-6">
                  By signing in you agree to our{" "}
                  <span className="text-primary font-semibold cursor-pointer hover:underline">Terms</span> and{" "}
                  <span className="text-primary font-semibold cursor-pointer hover:underline">Privacy Policy</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* ─── Email / Password ─── */}
          {mode === "email" && (
            <motion.div key="email" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
              <div className="rounded-3xl border border-border/10 glass p-8 shadow-2xl backdrop-blur-xl">
                <button onClick={() => { setMode("landing"); clearError(); }} className="flex items-center gap-1.5 text-sm text-ink-secondary hover:text-ink font-semibold mb-6 transition-colors">
                  <ChevronLeft size={18} /> Back
                </button>

                {/* Tab toggle */}
                <div className="flex rounded-2xl bg-surface-bg p-1 mb-6">
                  {(["signin", "signup"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setEmailMode(m); clearError(); }}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${emailMode === m ? "bg-primary text-white shadow-glow-primary" : "text-ink-secondary hover:text-ink"}`}
                    >
                      {m === "signin" ? "Sign In" : "Create Account"}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleEmail} className="space-y-4">
                  {emailMode === "signup" && (
                    <div className="flex items-center gap-3 rounded-2xl border border-border/10 bg-surface-bg px-4 py-3.5 focus-within:border-primary focus-within:bg-surface-glass transition-all">
                      <User size={18} className="text-ink-tertiary shrink-0" />
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full Name"
                        className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-tertiary outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-2xl border border-border/10 bg-surface-bg px-4 py-3.5 focus-within:border-primary focus-within:bg-surface-glass transition-all">
                    <Mail size={18} className="text-ink-tertiary shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full bg-transparent text-sm font-semibold text-ink placeholder:text-ink-tertiary outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-border/10 bg-surface-bg px-4 py-3.5 focus-within:border-primary focus-within:bg-surface-glass transition-all">
                    <Lock size={18} className="text-ink-tertiary shrink-0" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="flex-1 bg-transparent text-sm font-semibold text-ink placeholder:text-ink-tertiary outline-none"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-ink-tertiary hover:text-ink transition-colors">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400">
                      {error}
                    </motion.p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading || !email || !password}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-primary text-white font-bold py-4 shadow-glow-primary hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : (
                      <>{emailMode === "signin" ? "Sign In" : "Create Account"} <ArrowRight size={18} /></>
                    )}
                  </motion.button>
                </form>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/10" /></div>
                  <div className="relative flex justify-center text-xs text-ink-tertiary"><span className="bg-transparent px-3 font-semibold">or</span></div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border/10 bg-surface-bg hover:bg-surface-glass px-5 py-4 font-bold text-ink text-sm transition-all disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </motion.button>
              </div>
            </motion.div>
          )}



        </AnimatePresence>
      </div>
    </main>
  );
}
