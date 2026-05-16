"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Edit3, Heart, LogOut, MessageCircle,
  PackageCheck, PackageOpen, Plus, ShieldCheck, Trash2, TrendingUp
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditListingModal from "@/components/EditListingModal";
import EditProfileModal from "@/components/EditProfileModal";
import { deleteProduct, getProducts, getUserProducts, markProductAsSold, getCurrentUser } from "@/services/api";
import type { Product, User as BackendUser } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/profile");
  }, [user, loading, router]);

  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      getCurrentUser().then((bUser) => {
        if (bUser) {
          setBackendUser(bUser);
          getUserProducts(bUser._id).then((data) => {
            setProducts(data);
            setProductsLoading(false);
          });
        }
      });
    }
  }, [user]);

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    setIsActionLoading(true);
    try {
      await deleteProduct(selectedProduct._id);
      setProducts(products.filter((p) => p._id !== selectedProduct._id));
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleEditSuccess = (updated: Product) => {
    setProducts(products.map((p) => p._id === updated._id ? updated : p));
  };

  const handleMarkAsSold = async (productId: string) => {
    try {
      await markProductAsSold(productId);
      setProducts(products.map((p) => p._id === productId ? { ...p, status: "sold" } : p));
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  const activeCount = products.filter((p) => p.status === "active").length;
  const soldCount = products.filter((p) => p.status === "sold").length;

  const displayName = user.displayName || user.email?.split("@")[0] || "Seller";
  const avatarUrl = user.photoURL;
  const initial = displayName[0].toUpperCase();

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Profile Header Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/10 bg-surface-bg p-5 sm:p-8 shadow-card mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            {/* Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
              <div className="relative group">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={110}
                    height={110}
                    className="h-24 w-24 sm:h-28 sm:w-28 rounded-[32px] object-cover border-4 border-surface-secondary shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-[32px] bg-gradient-primary flex items-center justify-center text-white text-4xl font-black border-4 border-surface-secondary shadow-glow-primary">
                    {initial}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-emerald-500 border-4 border-surface-bg flex items-center justify-center text-white shadow-lg">
                  <ShieldCheck size={14} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-black text-ink tracking-tight">{displayName}</h1>
                  <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">
                    Verified Seller
                  </span>
                </div>
                <p className="text-sm sm:text-base font-bold text-ink-secondary">{user.email || user.phoneNumber || ""}</p>
                {backendUser?.college && (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-black text-primary border border-primary/5">
                    <CheckCircle2 size={14} /> {backendUser.college}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Link href="/post" className="btn-primary justify-center px-6 py-4 sm:py-3 text-sm flex-1 sm:flex-none">
                <Plus size={18} />
                New Listing
              </Link>
              <button 
                onClick={() => setIsProfileModalOpen(true)}
                className="btn-secondary justify-center px-6 py-4 sm:py-3 text-sm flex-1 sm:flex-none"
              >
                <Edit3 size={18} />
                Edit Profile
              </button>
              <button
                onClick={async () => { await logout(); router.replace("/"); }}
                className="btn-secondary justify-center px-6 py-4 sm:py-3 text-sm flex-1 sm:flex-none text-red-500 hover:bg-red-500/10 hover:border-red-500/20"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-border/10 pt-8">
            {[
              { label: "Total Items", value: products.length, icon: PackageCheck, bg: "bg-blue-500/5", text: "text-blue-500" },
              { label: "Active Now", value: activeCount, icon: TrendingUp, bg: "bg-emerald-500/5", text: "text-emerald-500" },
              { label: "Items Sold", value: soldCount, icon: CheckCircle2, bg: "bg-purple-500/5", text: "text-purple-500" },
              { label: "Favorites", value: 0, icon: Heart, bg: "bg-red-500/5", text: "text-red-500" },
            ].map(({ label, value, icon: Icon, bg, text }) => (
              <div key={label} className={`rounded-3xl ${bg} p-5 border border-border/5 group hover:border-border/10 transition-all`}>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-3">
                  <div className={`p-1.5 rounded-lg ${bg} ${text}`}>
                    <Icon size={14} />
                  </div>
                  {label}
                </div>
                <p className="text-3xl font-black text-ink">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Seller Dashboard */}
        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-3xl font-black text-ink">Your Listings</h2>
              <p className="text-ink-secondary mt-2">Manage your listings, mark items sold, and chat with buyers.</p>
            </div>
            <Link href="/chat" className="btn-primary justify-center sm:justify-start">
              <MessageCircle size={18} />
              <span className="hidden sm:inline">View Messages</span>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl bg-surface-secondary h-72 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-border/10 glass p-8 text-center"
            >
              <div className="space-y-4">
                <PackageOpen size={48} className="text-ink-tertiary mx-auto" />
                <h3 className="text-xl font-black text-ink">No listings yet</h3>
                <p className="text-sm text-ink-secondary">Start selling to see your listings here.</p>
                <Link href="/post" className="btn-primary mx-auto">
                  <Plus size={18} /> Post Your First Item
                </Link>
              </div>
            </motion.div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div key={product._id} className="space-y-3">
                  <ProductCard product={product} />
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleMarkAsSold(product._id)}
                      disabled={product.status === "sold"}
                      className="rounded-xl bg-primary-light text-primary px-3 py-2.5 text-sm font-bold transition-smooth hover:bg-primary hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {product.status === "sold" ? "Sold" : "Mark Sold"}
                    </button>
                    <button 
                      onClick={() => handleEditClick(product)}
                      className="rounded-xl border border-border bg-surface-bg text-ink-secondary px-3 py-2.5 text-sm font-bold transition-smooth hover:bg-surface-secondary"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(product)}
                      className="flex items-center justify-center rounded-xl border border-border bg-surface-bg text-secondary px-3 py-2.5 text-sm font-bold transition-smooth hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400" 
                      aria-label={`Delete ${product.title}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={selectedProduct?.title || ""}
        loading={isActionLoading}
      />

      {selectedProduct && (
        <EditListingModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={handleEditSuccess}
          product={selectedProduct}
        />
      )}

      <EditProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </main>
  );
}
