"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle2, Edit3, Heart, LogOut, MessageCircle,
  PackageCheck, PackageOpen, Plus, ShieldCheck, Trash2, TrendingUp, MapPin
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import EditListingModal from "@/components/EditListingModal";
import EditProfileModal from "@/components/EditProfileModal";
import { deleteProduct, getFavorites, getUserProducts, markProductAsSold, getCurrentUser, toggleFavorite } from "@/services/api";
import type { Product, User as BackendUser } from "@/lib/types";

type ProfileTab = "listings" | "favorites";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Set<string>>(new Set());

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

  // Load favorites whenever user is available
  useEffect(() => {
    if (!user) return;
    setFavoritesLoading(true);
    getFavorites().then((favs) => {
      setFavorites(favs);
      setFavoritedIds(new Set(favs.map((f) => f._id)));
      setFavoritesLoading(false);
    });
  }, [user]);

  async function handleToggleFavorite(productId: string) {
    const nowFaved = !favoritedIds.has(productId);
    setFavoritedIds((prev) => {
      const next = new Set(prev);
      if (nowFaved) next.add(productId); else next.delete(productId);
      return next;
    });
    try {
      await toggleFavorite(productId);
      // Refresh favorites list if we're on favorites tab
      if (activeTab === "favorites") {
        const updated = await getFavorites();
        setFavorites(updated);
        setFavoritedIds(new Set(updated.map((f) => f._id)));
      }
    } catch {
      // revert on error
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        if (nowFaved) next.delete(productId); else next.add(productId);
        return next;
      });
    }
  }

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

  const displayName = backendUser?.name || user.displayName || user.email?.split("@")[0] || "Seller";
  const avatarUrl = backendUser?.avatar || user.photoURL;
  const initial = displayName[0].toUpperCase();

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-32 sm:pb-12">
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
                <div className="flex flex-wrap gap-2">
                  {backendUser?.college && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-black text-primary border border-primary/5">
                      <CheckCircle2 size={14} /> {backendUser.college}
                    </div>
                  )}
                  {backendUser?.locations && backendUser.locations.find(l => l.isDefault) && (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-1.5 text-xs font-black text-primary border border-primary/5 max-w-xs">
                      <MapPin size={14} />
                      <span className="truncate">{backendUser.locations.find(l => l.isDefault)?.address}</span>
                    </div>
                  )}
                </div>
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
              { label: "Favourites", value: favorites.length, icon: Heart, bg: "bg-red-500/5", text: "text-red-500" },
            ].map(({ label, value, icon: Icon, bg, text }) => (
              <button
                key={label}
                onClick={() => {
                  if (label === "Favourites") setActiveTab("favorites");
                  else setActiveTab("listings");
                }}
                className={`rounded-3xl ${bg} p-5 border transition-all text-left ${
                  (label === "Favourites" && activeTab === "favorites") ||
                  (label !== "Favourites" && activeTab === "listings")
                    ? "border-border/20 scale-[0.98]"
                    : "border-border/5 hover:border-border/10"
                }`}
              >
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-3">
                  <div className={`p-1.5 rounded-lg ${bg} ${text}`}>
                    <Icon size={14} />
                  </div>
                  {label}
                </div>
                <p className="text-3xl font-black text-ink">{value}</p>
              </button>
            ))}
          </div>
        </motion.section>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("listings")}
            className={`rounded-full px-5 py-2 text-sm font-black transition-all ${
              activeTab === "listings"
                ? "bg-slate-900 text-white shadow-soft"
                : "bg-surface-bg border border-border/10 text-ink-secondary hover:text-ink"
            }`}
          >
            Your Listings
          </button>
          <button
            onClick={() => setActiveTab("favorites")}
            className={`rounded-full px-5 py-2 text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === "favorites"
                ? "bg-orange-500 text-white shadow-soft"
                : "bg-surface-bg border border-border/10 text-ink-secondary hover:text-ink"
            }`}
          >
            <Heart size={14} className={activeTab === "favorites" ? "fill-white" : ""} />
            Favourites
            {favorites.length > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                activeTab === "favorites" ? "bg-white/20 text-white" : "bg-orange-500/10 text-orange-500"
              }`}>
                {favorites.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab: Your Listings */}
        {activeTab === "listings" && (
          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-black text-ink">Your Listings</h2>
                <p className="text-xs sm:text-sm text-ink-secondary mt-1 sm:mt-2">Manage your listings and mark items sold.</p>
              </div>
              <Link href="/chat" className="btn-primary justify-center sm:justify-start py-3 text-sm">
                <MessageCircle size={18} />
                View Messages
              </Link>
            </div>

            {productsLoading ? (
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="rounded-2xl bg-surface-secondary h-48 sm:h-72 animate-pulse" />
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
              <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <div key={product._id} className="space-y-3">
                    <ProductCard
                      product={product}
                      isFavorited={favoritedIds.has(product._id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button 
                        onClick={() => handleMarkAsSold(product._id)}
                        disabled={product.status === "sold"}
                        className="col-span-2 sm:col-span-1 rounded-xl bg-primary-light text-primary px-2 py-2 text-[10px] sm:text-sm font-bold transition-smooth hover:bg-primary hover:text-white disabled:opacity-50"
                      >
                        {product.status === "sold" ? "Sold" : "Mark Sold"}
                      </button>
                      <button 
                        onClick={() => handleEditClick(product)}
                        className="rounded-xl border border-border bg-surface-bg text-ink-secondary px-2 py-2 text-[10px] sm:text-sm font-bold transition-smooth hover:bg-surface-secondary"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(product)}
                        className="flex items-center justify-center rounded-xl border border-border bg-surface-bg text-secondary px-2 py-2 text-[10px] sm:text-sm font-bold transition-smooth hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400" 
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab: Favourites */}
        {activeTab === "favorites" && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-ink">Saved Favourites</h2>
              <p className="text-xs sm:text-sm text-ink-secondary mt-1 sm:mt-2">Listings you've saved for later.</p>
            </div>

            {favoritesLoading ? (
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-2xl bg-surface-secondary h-48 sm:h-72 animate-pulse" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="grid min-h-[300px] place-items-center rounded-2xl border border-dashed border-border/10 glass p-8 text-center"
              >
                <div className="space-y-4">
                  <Heart size={48} className="text-ink-tertiary mx-auto" />
                  <h3 className="text-xl font-black text-ink">No favourites yet</h3>
                  <p className="text-sm text-ink-secondary">
                    Tap the heart on any listing to save it here.
                  </p>
                  <Link href="/" className="btn-primary mx-auto">
                    <Plus size={18} /> Browse Listings
                  </Link>
                </div>
              </motion.div>
            ) : (
              <div className="grid gap-3 sm:gap-6 grid-cols-2 lg:grid-cols-3">
                {favorites.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    isFavorited={true}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </section>
        )}
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
