"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

type User = FirebaseUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | ((prev: User | null) => User | null)) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get token and store it
          const token = await firebaseUser.getIdToken();
          localStorage.setItem("token", token);
          
          setUserState(firebaseUser as User);
        } else {
          setUserState(null);
          localStorage.removeItem("token");
        }
      } catch (error) {
        console.error("Error setting up auth:", error);
        setUserState(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("token");
      setUserState(null);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const setUser = (updater: User | ((prev: User | null) => User | null)) => {
    if (typeof updater === "function") {
      setUserState((prev) => updater(prev));
    } else {
      setUserState(updater);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
