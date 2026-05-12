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
          className="rounded-2xl border border-border bg-surface-bg p-6 shadow-soft mb-8"
        >
          <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            {/* Avatar & Info */}
            <div className="flex items-center gap-5">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-primary"
                />
              ) : (
                <div className="h-24 w-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-white text-4xl font-black border-2 border-primary shadow-glow-primary">
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="truncate text-3xl font-black text-ink">{displayName}</h1>
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-light px-3 py-1 text-xs font-bold text-primary">
                    <ShieldCheck size={14} /> Verified
                  </span>
                </div>
                <p className="font-semibold text-ink-secondary">{user.email || user.phoneNumber || ""}</p>
                {user.phoneNumber && <p className="text-sm text-ink-tertiary mt-1">{user.phoneNumber}</p>}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid gap-2 sm:grid-cols-3 lg:justify-self-end">
              <Link href="/post" className="btn-primary justify-center">
                <Plus size={18} />
                <span className="hidden sm:inline">New Listing</span>
              </Link>
              <button className="btn-secondary justify-center">
                <Edit3 size={18} />
                <span className="hidden sm:inline">Edit Profile</span>
              </button>
              <button
                onClick={async () => { await logout(); router.replace("/"); }}
                className="btn-secondary justify-center text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-3 border-t border-border pt-6 sm:grid-cols-4">
            {[
              { label: "Listings", value: products.length, icon: PackageCheck },
              { label: "Active", value: activeCount, icon: TrendingUp },
              { label: "Sold", value: soldCount, icon: CheckCircle2 },
              { label: "Favorites", value: 0, icon: Heart },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-xl bg-surface-secondary p-4">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-ink-secondary mb-2">
                  <Icon size={18} className="text-primary" />
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
    </main>
  );
}
