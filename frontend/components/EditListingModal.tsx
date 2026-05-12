import { useState, useEffect, useRef } from "react";
import { X, Loader2, IndianRupee, MapPin, BookOpen, Cpu, Camera, ImagePlus, AlertCircle, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { updateProduct, uploadImages } from "@/services/api";
import type { Product } from "@/lib/types";
import Image from "next/image";

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedProduct: Product) => void;
  product: Product;
}

export default function EditListingModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: EditListingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Image states
  const [existingImages, setExistingImages] = useState<string[]>(product.images);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    title: product.title,
    price: product.price.toString(),
    description: product.description,
    category: product.category,
    condition: product.condition,
    college: product.college,
  });

  useEffect(() => {
    setForm({
      title: product.title,
      price: product.price.toString(),
      description: product.description,
      category: product.category,
      condition: product.condition,
      college: product.college,
    });
    setExistingImages(product.images);
    setNewFiles([]);
    setNewPreviews([]);
  }, [product]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const totalCount = existingImages.length + newFiles.length;
      const remainingSlots = 6 - totalCount;
      if (remainingSlots <= 0) return;

      const addedFiles = Array.from(e.target.files).slice(0, remainingSlots);
      setNewFiles((prev) => [...prev, ...addedFiles]);

      const addedPreviews = addedFiles.map(file => URL.createObjectURL(file));
      setNewPreviews((prev) => [...prev, ...addedPreviews]);
    }
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
  };

  const removeNewFile = (index: number) => {
    setNewFiles(newFiles.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!form.title.trim() || !form.price || !form.description.trim() || !form.college.trim()) {
        throw new Error("Please fill in all required fields.");
      }

      if (existingImages.length + newFiles.length === 0) {
        throw new Error("At least one photo is required.");
      }

      let finalImages = [...existingImages];

      // Upload new images if any
      if (newFiles.length > 0) {
        const uploadedUrls = await uploadImages(newFiles);
        finalImages = [...finalImages, ...uploadedUrls];
      }

      const updatedData = {
        ...form,
        price: Number(form.price),
        images: finalImages,
      };

      const result = await updateProduct(product._id, updatedData);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to update listing. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-3xl rounded-[2.5rem] border border-border/10 bg-surface-bg/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-2xl overflow-hidden my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/50 p-8">
                <div>
                  <h2 className="text-3xl font-black tracking-tight text-ink">Edit Listing</h2>
                  <p className="text-sm font-bold text-ink-tertiary mt-1">Keep your item info fresh and attractive</p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary/50 text-ink-tertiary transition-all hover:bg-surface-secondary/80 hover:text-ink active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
                
                {/* Image Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-ink">Photos</span>
                    <span className="text-xs font-black text-ink-tertiary uppercase tracking-widest">
                      {existingImages.length + newFiles.length} / 6
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-6">
                    {/* Existing Images */}
                    {existingImages.map((url, idx) => (
                      <div key={url} className="relative aspect-square rounded-2xl border border-border/10 overflow-hidden group">
                        <Image src={url} alt="Listing" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} />
                        </button>
                        {idx === 0 && <span className="absolute left-2 bottom-2 px-2 py-0.5 rounded-lg bg-primary text-[10px] font-black text-white shadow-soft uppercase">Main</span>}
                      </div>
                    ))}

                    {/* New Previews */}
                    {newPreviews.map((src, idx) => (
                      <div key={src} className="relative aspect-square rounded-2xl border border-primary/30 overflow-hidden group">
                        <Image src={src} alt="New Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewFile(idx)}
                          className="absolute right-2 top-2 h-7 w-7 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={14} />
                        </button>
                        <span className="absolute left-2 top-2 px-2 py-0.5 rounded-lg bg-primary text-[8px] font-black text-white shadow-soft uppercase">New</span>
                      </div>
                    ))}

                    {/* Upload Button */}
                    {existingImages.length + newFiles.length < 6 && (
                      <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/10 bg-surface-secondary/50 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary group">
                        <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                        <Plus size={24} className="text-ink-tertiary group-hover:text-primary transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary group-hover:text-primary">Add</span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2">
                  <label className="space-y-3 col-span-2">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Listing Title *</span>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-2xl border border-border/10 bg-surface-secondary/50 px-6 py-4 text-lg font-bold text-ink placeholder:text-ink-tertiary focus:border-primary/50 focus:bg-surface-secondary/80 outline-none transition-all"
                      placeholder="e.g., Physics Textbook"
                    />
                  </label>

                  <label className="space-y-3">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Price (₹) *</span>
                    <div className="relative">
                      <IndianRupee className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="w-full rounded-2xl border border-border/10 bg-surface-secondary/50 pl-14 pr-6 py-4 text-lg font-bold text-ink placeholder:text-ink-tertiary focus:border-primary/50 focus:bg-surface-secondary/80 outline-none transition-all"
                        placeholder="500"
                      />
                    </div>
                  </label>

                  <label className="space-y-3">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Location *</span>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-primary" size={20} />
                      <input
                        value={form.college}
                        onChange={(e) => setForm({ ...form, college: e.target.value })}
                        className="w-full rounded-2xl border border-border/10 bg-surface-secondary/50 pl-14 pr-6 py-4 text-lg font-bold text-ink placeholder:text-ink-tertiary focus:border-primary/50 focus:bg-surface-secondary/80 outline-none transition-all"
                        placeholder="College Name"
                      />
                    </div>
                  </label>

                  <div className="space-y-3 col-span-2">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Category</span>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { value: "book", label: "Textbook", icon: BookOpen },
                        { value: "equipment", label: "Equipment", icon: Cpu }
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setForm({ ...form, category: value as any })}
                          className={`flex items-center gap-4 rounded-2xl border-2 px-6 py-4 transition-all ${form.category === value
                            ? "border-primary bg-primary/10 text-primary shadow-glow-primary/20"
                            : "border-border/10 bg-surface-secondary/50 text-ink-secondary hover:border-primary/30"
                            }`}
                        >
                          <Icon size={24} />
                          <span className="font-black text-base">{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 col-span-2">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Condition</span>
                    <div className="grid grid-cols-3 gap-4">
                      {["new", "good", "used"].map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => setForm({ ...form, condition: cond as any })}
                          className={`rounded-2xl border-2 py-4 text-base font-black transition-all capitalize ${form.condition === cond
                            ? "border-primary bg-primary text-white shadow-glow-primary/20"
                            : "border-border/10 bg-surface-secondary/50 text-ink-secondary hover:border-primary/30"
                            }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="space-y-3 col-span-2">
                    <span className="text-sm font-black text-ink-secondary uppercase tracking-widest">Description *</span>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="w-full rounded-2xl border border-border/10 bg-surface-secondary/50 px-6 py-4 text-lg font-bold text-ink placeholder:text-ink-tertiary focus:border-primary/50 focus:bg-surface-secondary/80 outline-none transition-all min-h-[160px] resize-none"
                      placeholder="Tell buyers more about your item..."
                    />
                  </label>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-2xl bg-red-500/10 border border-red-500/20 p-6 flex items-center gap-3 text-red-400 font-bold"
                  >
                    <AlertCircle size={24} />
                    {error}
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border/50">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-surface-secondary/50 py-5 font-black text-ink-tertiary transition-all hover:bg-surface-secondary/80 hover:text-ink active:scale-95 disabled:opacity-50"
                  >
                    Cancel Changes
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="flex-[2] flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-blue-600 py-5 font-black text-white shadow-glow-primary transition-all hover:shadow-[0_20px_40px_-12px_rgba(91,140,255,0.4)] disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <span>Publish Updates</span>
                        <Plus size={20} />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
