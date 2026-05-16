"use client";
import React, { useEffect, useState } from "react";
import { getAdminProducts, toggleProductDisabled } from "@/services/api";
import { Search, Eye, EyeOff, Tag, MapPin, User, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductManagement() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await getAdminProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const updatedProduct = await toggleProductDisabled(id);
      setProducts(products.map(p => p._id === id ? updatedProduct : p));
    } catch (err) {
      alert("Failed to update product status");
    }
  }

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">Listing Management</h1>
          <p className="mt-2 font-medium text-ink-secondary text-sm">Moderate all platform listings and soft-delete problematic content.</p>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search listings..."
            className="w-full rounded-2xl border border-border/10 bg-surface-bg py-3 pl-12 pr-4 text-sm font-semibold text-ink outline-none focus:border-primary/50 transition-all shadow-card"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-border/10 bg-surface-bg shadow-card">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-tertiary/50">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Product</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Seller</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Category</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Price</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Visibility</th>
                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-wider text-ink-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              <AnimatePresence>
                {filteredProducts.map((product) => (
                  <motion.tr 
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-surface-glass transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border/10 bg-surface-tertiary">
                          <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="max-w-[200px]">
                          <p className="truncate text-sm font-black text-ink" title={product.title}>{product.title}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                            <Tag size={12} className="text-primary/60" />
                            {product.condition.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink-secondary">
                        <User size={14} className="text-ink-tertiary" />
                        {product.sellerId?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="inline-flex rounded-lg bg-surface-tertiary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-ink">
                        {product.category}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-primary">₹{product.price}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        !product.isAdminDisabled ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {!product.isAdminDisabled ? "Public" : "Disabled by Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => handleToggle(product._id)}
                        className={`rounded-xl px-4 py-2 text-xs font-black uppercase transition-all ${
                          !product.isAdminDisabled 
                            ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                            : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                        }`}
                      >
                        {!product.isAdminDisabled ? <div className="flex items-center gap-1.5"><EyeOff size={14} /> Disable</div> : <div className="flex items-center gap-1.5"><Eye size={14} /> Enable</div>}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block lg:hidden p-4 space-y-4">
          <AnimatePresence>
            {filteredProducts.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl border border-border/5 bg-surface-secondary/40 p-4 space-y-4"
              >
                {/* Header */}
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/10 bg-surface-tertiary">
                    <img src={product.images[0]} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-ink truncate">{product.title}</p>
                    <p className="text-xs font-black text-primary mt-0.5">₹{product.price}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase text-ink-secondary">
                      <Tag size={10} className="text-primary/60" />
                      {product.condition}
                    </div>
                  </div>
                </div>

                {/* Details Row */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-ink-secondary border-y border-border/5 py-3">
                  <div className="flex items-center gap-1.5">
                    <User size={12} className="text-ink-tertiary shrink-0" />
                    <span className="truncate">{product.sellerId?.name || "Unknown"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span className="uppercase tracking-wider">{product.category}</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center justify-between">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                    !product.isAdminDisabled ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {!product.isAdminDisabled ? "Public" : "Disabled"}
                  </span>
                  
                  <button 
                    onClick={() => handleToggle(product._id)}
                    className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase transition-all ${
                      !product.isAdminDisabled 
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                        : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                    }`}
                  >
                    {!product.isAdminDisabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center p-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tertiary text-ink-tertiary">
              <Package size={32} />
            </div>
            <p className="text-lg font-black text-ink">No products found</p>
            <p className="text-sm font-medium text-ink-secondary">The inventory is currently empty or filtered.</p>
          </div>
        )}
      </div>
    </div>
  );
}
