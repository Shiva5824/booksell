"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User, signOut, sendEmailVerification } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCurrentUser, warmUpBackend } from "@/services/api";
import { Mail, Loader2, LogOut, RefreshCw } from "lucide-react";

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar?: string; phone?: string; college?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  logout: async () => {},
  refreshUser: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  // `loading` only tracks whether Firebase has resolved its initial auth
  // state. We do NOT block rendering on the dbUser fetch — that happens in
  // the background so public pages (homepage, browse, product detail) load
  // instantly even when the backend is cold-starting on Render.
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

  const fetchDbUser = async () => {
    try {
      const profile = await getCurrentUser();
      setDbUser(profile);
    } catch (err) {
      console.error("Failed to fetch user profile", err);
      setDbUser(null);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const { updateUserProfile } = await import("@/services/api");
      const updated = await updateUserProfile(data);
      setDbUser(updated);
    } catch (err) {
      console.error("Failed to update profile", err);
      throw err;
    }
  };

  useEffect(() => {
    // Wake up the backend as soon as the app loads so subsequent calls
    // don't pay the cold-start tax.
    warmUpBackend();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        localStorage.setItem("token", token);
        setUser(firebaseUser);

        // Resolve the loading gate immediately so the UI can render.
        // Fetch the dbUser in the background; components that need it
        // already handle its absence gracefully.
        const isEmailAuth = firebaseUser.providerData[0]?.providerId === "password";
        const shouldFetch = !isEmailAuth || firebaseUser.emailVerified;
        setLoading(false);
        if (shouldFetch) {
          // Fire-and-forget. Setting state inside is safe.
          fetchDbUser();
        }
      } else {
        localStorage.removeItem("token");
        setUser(null);
        setDbUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const checkVerification = async () => {
    if (!auth.currentUser) return;
    setChecking(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        const token = await auth.currentUser.getIdToken(true);
        localStorage.setItem("token", token);
        setUser({ ...auth.currentUser });
        await fetchDbUser();
      } else {
        alert("Email is still not verified. Please check your inbox and click the verification link!");
      }
    } catch (err: any) {
      alert("Failed to check status: " + err.message);
    } finally {
      setChecking(false);
    }
  };

  const resendVerification = async () => {
    if (!auth.currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser);
      alert("A new verification link has been sent to your email!");
    } catch (err: any) {
      alert("Failed to send link: " + err.message);
    } finally {
      setResending(false);
    }
  };

  const isEmailAuth = user?.providerData[0]?.providerId === "password";
  const needsVerification = user && isEmailAuth && !user.emailVerified;

  // Email-verification gate is the only screen that needs to take over the
  // whole tree; everything else renders immediately. The brief delay while
  // Firebase initializes from IndexedDB is short enough that public pages
  // can render in their unauthenticated state without a flash of bad UI.
  if (needsVerification) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative dynamic glows */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-secondary/10 blur-[100px]" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-[40px] border border-border/10 glass p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary animate-pulse">
              <Mail size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-ink">Verify Your Email</h1>
              <p className="text-sm font-medium text-ink-secondary leading-relaxed">
                We've sent a verification link to <span className="font-bold text-primary">{user?.email}</span>.
                Please verify your email address to unlock SellChey.
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <button
                onClick={checkVerification}
                disabled={checking}
                className="w-full flex items-center justify-center gap-2 btn-primary py-4 font-bold rounded-2xl shadow-glow-primary transition-all disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <RefreshCw size={18} />
                )}
                I have verified my email
              </button>

              <div className="flex gap-3">
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="flex-1 btn-secondary py-3 text-xs font-bold rounded-2xl border border-border/10 hover:bg-surface-glass disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend Link"}
                </button>
                <button
                  onClick={logout}
                  className="flex-1 btn-secondary py-3 text-xs font-bold rounded-2xl border border-border/10 hover:bg-surface-glass text-red-400 border-red-500/10 flex items-center justify-center gap-1.5"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, logout, refreshUser: fetchDbUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
