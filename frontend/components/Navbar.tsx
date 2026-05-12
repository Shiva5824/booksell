"use client";

import Link from "next/link";
import { Bell, LogOut, MessageCircle, Plus, Search, ShoppingBag, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import Image from "next/image";

const guestLinks = [
  { href: "/", label: "Browse", icon: Search },
];

const authLinks = [
  { href: "/", label: "Browse", icon: Search },
  { href: "/post", label: "Sell", icon: Plus },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Account", icon: UserRound },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const links = user ? authLinks : guestLinks;

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-50 glass border-b-0">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-black text-ink group transition-smooth">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-soft group-hover:shadow-glow-primary transition-smooth"
          >
            <ShoppingBag size={22} />
          </motion.div>
          <span className="text-2xl font-black tracking-tight text-gradient">SellChey</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-4 sm:flex">
          <nav className="flex items-center gap-1.5 rounded-2xl border border-border bg-surface-secondary/50 p-1.5 backdrop-blur-md">
            {links.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-smooth ${
                    active ? "text-white" : "text-ink-secondary hover:text-ink hover:bg-surface-tertiary"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="navbar-active"
                      className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow-primary"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={18} className={active ? "text-white" : ""} />
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Notification (only when logged in) */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-secondary/50 text-ink-secondary transition-smooth hover:bg-surface-tertiary hover:text-ink"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-secondary animate-pulseGlow" />
            </motion.button>
          )}

          <ThemeToggle />

          {/* Auth button */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <Link href="/profile" className="flex items-center gap-2 rounded-2xl border border-border bg-surface-secondary/50 px-3 py-2 hover:bg-surface-tertiary transition-smooth">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt={user.displayName || "User"} width={28} height={28} className="rounded-lg object-cover" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-gradient-primary flex items-center justify-center text-white text-xs font-black">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-bold text-ink truncate max-w-[100px]">{user.displayName || user.email?.split("@")[0]}</span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-surface-secondary/50 text-ink-secondary hover:text-red-400 hover:bg-red-500/10 transition-smooth"
                  aria-label="Sign out"
                >
                  <LogOut size={18} />
                </motion.button>
              </div>
            ) : (
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-white shadow-glow-primary hover:opacity-90 transition-all"
                >
                  Sign In
                </motion.button>
              </Link>
            )
          )}
        </div>

        {/* Mobile top-right */}
        <div className="sm:hidden flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            user ? (
              <Link href="/post" className="btn-primary py-2 px-4 text-sm">
                <Plus size={20} />
                <span>Sell</span>
              </Link>
            ) : (
              <Link href="/login">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-primary px-4 py-2 text-sm font-bold text-white shadow-glow-primary"
                >
                  Sign In
                </motion.button>
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobile Bottom Bar — only when authenticated */}
      {user && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border sm:hidden pb-safe">
          <div className="mx-auto flex max-w-7xl justify-around px-2 py-2">
            {authLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-bold transition-smooth"
                >
                  {active && (
                    <motion.div
                      layoutId="mobile-nav-active"
                      className="absolute inset-0 bg-primary/10 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={`relative z-10 flex flex-col items-center gap-1 ${active ? "text-primary" : "text-ink-secondary"}`}>
                    <motion.div animate={{ y: active ? -2 : 0 }}>
                      <Icon size={22} className={active ? "text-primary fill-primary/20" : ""} />
                    </motion.div>
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
