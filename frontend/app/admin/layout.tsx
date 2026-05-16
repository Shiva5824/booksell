"use client";
import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { LayoutDashboard, Users, ShoppingBag, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dbUser, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && (!dbUser || dbUser.role !== "admin")) {
      router.replace("/");
    }
  }, [dbUser, loading, router]);

  if (loading || !dbUser || dbUser.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    { label: "Overview", icon: LayoutDashboard, href: "/admin" },
    { label: "Users", icon: Users, href: "/admin/users" },
    { label: "Products", icon: ShoppingBag, href: "/admin/products" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-border/10 bg-surface-bg p-6 lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-glow-primary">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-black tracking-tight text-ink">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-glow-primary"
                    : "text-ink-secondary hover:bg-surface-glass hover:text-ink"
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl border border-border/10 px-4 py-3 text-sm font-bold text-ink-secondary hover:bg-surface-glass hover:text-ink transition-all"
          >
            <ArrowLeft size={18} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 min-w-0 overflow-x-hidden">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 border-b border-border/10 bg-background/80 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-primary" size={24} />
              <span className="text-lg font-black text-ink">Admin Panel</span>
            </div>
            <Link href="/" className="rounded-lg p-2 text-ink-secondary hover:bg-surface-glass">
              <ArrowLeft size={20} />
            </Link>
          </div>
          
          {/* Mobile Navigation Pills */}
          <nav className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-none items-center gap-2 rounded-full px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-glow-primary"
                      : "bg-surface-secondary text-ink-secondary border border-border/10"
                  }`}
                >
                  <item.icon size={14} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="min-h-screen p-4 sm:p-6 lg:p-10 pb-32 sm:pb-10 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
