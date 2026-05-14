"use client";

import Link from "next/link";
import { LogOut, MessageCircle, Plus, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "./AuthProvider";
import Image from "next/image";
import { useState } from "react";

const authLinks = [
  { href: "/", label: "Browse", icon: Search },
  { href: "/post", label: "Sell", icon: Plus },
  { href: "/chat", label: "Messages", icon: MessageCircle },
  { href: "/profile", label: "Account", icon: UserRound },
];

const guestBottomLinks = [
  { href: "/", label: "Browse", icon: Search },
  { href: "/login", label: "Sign In", icon: UserRound },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const bottomLinks = user ? authLinks : guestBottomLinks;

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/10 bg-white/95 shadow-sm backdrop-blur-xl dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-black text-ink group transition-smooth tap-highlight-none">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white shadow-soft transition-smooth group-hover:shadow-glow-primary"
            >
              <ShoppingBag size={20} />
            </motion.div>
            <span className="text-xl font-black tracking-tight">
              Sell<span className="text-orange-500">Chey</span>
            </span>
          </Link>

          {/* Desktop Search Bar (lg+) */}
          <Link
            href="/#listings"
            className="hidden min-w-0 flex-1 items-center gap-3 rounded-full bg-[#f5f2ee] px-5 py-2.5 text-sm font-semibold text-ink-secondary transition-colors hover:bg-orange-50 lg:flex dark:bg-white/10 max-w-md"
          >
            <Search size={18} className="shrink-0 text-orange-500" />
            <span className="truncate">Search books, calculators, notes...</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 sm:flex">
            <nav className="flex items-center gap-0.5">
              {(user ? authLinks : [{ href: "/", label: "Browse", icon: Search }]).map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold transition-smooth ${
                      active ? "text-orange-500" : "text-ink-secondary hover:text-orange-500"
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="navbar-active"
                        className="absolute inset-0 rounded-full bg-orange-50 dark:bg-orange-500/10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon size={17} />
                      {label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <ThemeToggle />

            {/* Auth button */}
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 rounded-full border border-border/10 bg-surface px-3 py-1.5 transition-smooth hover:bg-orange-50"
                  >
                    {user.photoURL ? (
                      <Image src={user.photoURL} alt={user.displayName || "User"} width={26} height={26} className="rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-black">
                        {(user.displayName || user.email || "U")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-ink truncate max-w-[90px]">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                  </Link>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleLogout}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border/10 bg-surface text-ink-secondary transition-smooth hover:bg-red-50 hover:text-red-500"
                    aria-label="Sign out"
                  >
                    <LogOut size={16} />
                  </motion.button>
                </div>
              ) : (
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-soft transition-all hover:bg-orange-600"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )
            )}
          </div>

          {/* Mobile top-right controls */}
          <div className="sm:hidden flex items-center gap-2">
            {/* Mobile search toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileSearchOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border/10 bg-surface text-ink-secondary tap-highlight-none"
              aria-label="Search"
            >
              {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
            </motion.button>

            <ThemeToggle />

            {!loading && (
              user ? (
                <Link href="/post" className="btn-primary py-1.5 px-3 text-sm tap-highlight-none">
                  <Plus size={18} />
                  <span>Sell</span>
                </Link>
              ) : (
                <Link href="/login">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1.5 text-sm font-bold text-white shadow-soft tap-highlight-none"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile Collapsible Search Bar */}
        <AnimatePresence>
          {mobileSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="overflow-hidden border-t border-border/10 sm:hidden"
            >
              <div className="px-4 py-3">
                <Link
                  href="/#listings"
                  onClick={() => setMobileSearchOpen(false)}
                  className="flex w-full items-center gap-3 rounded-full bg-[#f5f2ee] px-5 py-3 text-sm font-semibold text-ink-secondary dark:bg-white/10"
                >
                  <Search size={18} className="shrink-0 text-orange-500" />
                  <span className="truncate text-ink-tertiary">Search books, calculators, notes...</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile Bottom Navigation — shown on mobile for all users */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/10 bg-white/95 shadow-soft backdrop-blur-xl sm:hidden dark:bg-slate-950/95 safe-bottom">
        <div className="mx-auto flex max-w-7xl justify-around px-1 py-1">
          {bottomLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={label}
                href={href}
                className="relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold tap-highlight-none"
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active"
                    className="absolute inset-0 bg-orange-50 rounded-xl dark:bg-orange-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={`relative z-10 flex flex-col items-center gap-0.5 ${active ? "text-orange-500" : "text-ink-secondary"}`}>
                  <motion.div animate={{ y: active ? -1 : 0 }}>
                    <Icon size={20} className={active ? "text-orange-500" : ""} />
                  </motion.div>
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
