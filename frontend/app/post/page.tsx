"use client";

import { useMemo, useState, useEffect } from "react";
import {
  BadgeIndianRupee,
  BookOpen,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  ImagePlus,
  IndianRupee,
  Loader2,
  Lock,
  MapPin,
  NotebookText,
  Smartphone,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Upload,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createProduct, uploadImages, getCurrentUser } from "@/services/api";
import LocationPicker from "@/components/LocationPickerNew";

type ListingForm = {
  title: string;
  price: string;
  description: string;
  // category is freeform on the client; we'll map to backend allowed categories before sending
  category: string;
  condition: "new" | "good" | "used";
  college: string;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
};

const steps = [
  { id: 1, title: "Basics", description: "What are you selling?" },
  { id: 2, title: "Details", description: "Set your price and location" },
  { id: 3, title: "Media", description: "Add photos of your item" },
];

export default function PostListingPage() {
  const { user, loading, dbUser } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isPublishing, setIsPublishing] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [form, setForm] = useState<ListingForm>({
    title: "",
    price: "",
    description: "",
    category: "book",
    condition: "good",
    college: "",
    location: undefined,
  });

  const completion = useMemo(() => {
    const checks = [
      form.title,
      form.price,
      form.description,
      form.location?.address,
      files.length > 0
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [files.length, form]);

  const CategoryIcon = useMemo(() => {
    switch (form.category) {
      case "book": return BookOpen;
      case "equipment": return Cpu;
      case "electronics": return Smartphone;
      case "notes": return NotebookText;
      default: return BookOpen;
    }
  }, [form.category]);

  // Fetch user's saved locations
  useEffect(() => {
    if (dbUser?.locations) {
      setSavedLocations(dbUser.locations);
      if (dbUser.locations.length > 0 && !form.location) {
        const defaultLocation = dbUser.locations.find((loc: any) => loc.isDefault) || dbUser.locations[0];
        setForm(prev => ({
          ...prev,
          location: {
            address: defaultLocation.address,
            latitude: defaultLocation.latitude,
            longitude: defaultLocation.longitude,
          }
        }));
      }
    }
  }, [dbUser]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 6 - files.length);
      setFiles((prev) => [...prev, ...newFiles]);

      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(prev[index]);
      return updated;
    });
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handlePublish = async () => {
    if (completion < 100) return;

    const priceNum = Number(form.price);
    if (isNaN(priceNum)) {
      alert("Please enter a valid price");
      setIsPublishing(false);
      return;
    }

    try {
      // 1. Upload images first
      const imageUrls = await uploadImages(files);

      // 2. Create product
      // Map client category to backend allowed categories if necessary
      const allowedCategories = ["ipe", "eapcet", "jee", "neet"];
      const backendCategory = allowedCategories.includes(form.category) ? form.category : "ipe";

      const productData = {
        ...form,
        category: backendCategory,
        price: priceNum,
        images: imageUrls,
      };

      const result = await createProduct(productData);
      if (result) {
        router.push(`/product/${result._id || ""}`);
      }
    } catch (error) {
      console.error("Publishing failed:", error);
      alert("Failed to publish listing. Please check your connection and try again.");
    } finally {
      setIsPublishing(false);
    }
  };

  // ── Auth guard ────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="text-sm font-semibold text-ink-secondary">Verifying access...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border/10 glass p-10 text-center shadow-2xl backdrop-blur-xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
            <Lock size={36} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-ink mb-2">Sign in to Sell</h1>
          <p className="text-sm text-ink-secondary mb-8 leading-relaxed">
            You need an account to post a listing. It only takes a few seconds to get started.
          </p>
          <Link
            href="/login?redirect=/post"
            className="inline-flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-primary px-6 py-4 font-bold text-white shadow-glow-primary hover:opacity-90 transition-all"
          >
            Sign In to Continue
          </Link>
          <Link href="/" className="mt-4 block text-sm font-semibold text-ink-tertiary hover:text-ink transition-colors">
            ← Back to Browse
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-nav">
      <div className="mx-auto max-w-5xl px-4 py-8">

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black text-ink sm:text-3xl">Post New Listing</h1>
              <p className="text-sm text-ink-secondary mt-1">{steps[currentStep - 1].description}</p>
            </div>
            <div className="flex items-center gap-3">
              {steps.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-500 ${
                    currentStep > s.id
                      ? "bg-primary text-white"
                      : currentStep === s.id
                      ? "bg-primary text-white ring-4 ring-primary/20"
                      : "bg-border/20 text-ink-tertiary"
                  }`}>{s.id}</div>
                  <span className={`text-xs font-bold hidden sm:block ${
                    currentStep >= s.id ? "text-ink" : "text-ink-tertiary"
                  }`}>{s.title}</span>
                  {s.id < 3 && <div className={`h-px w-6 transition-all duration-500 ${currentStep > s.id ? "bg-primary" : "bg-border/20"}`} />}
                </div>
              ))}
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1 w-full rounded-full bg-border/10">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 shadow-glow-primary"
              style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
            />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Multi-step Form Content */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6 rounded-2xl border border-border/5 bg-surface-bg p-8 shadow-soft">
                    <label className="block space-y-3">
                      <span className="text-lg font-bold text-ink">What are you selling? *</span>
                      <input
                        value={form.title}
                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g., HC Verma Concepts of Physics, NCERT Biology..."
                        className="input-base text-xl"
                        autoFocus
                      />
                    </label>

                    <div className="space-y-4">
                      <span className="block font-bold text-ink">Category</span>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { value: "ipe", label: "IPE", icon: BookOpen },
                          { value: "eapcet", label: "EAPCET", icon: FlaskConical },
                          { value: "jee", label: "JEE", icon: Cpu },
                          { value: "neet", label: "NEET", icon: Stethoscope }
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm({ ...form, category: value as any })}
                            className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all ${form.category === value
                              ? "border-primary bg-primary/5 text-primary shadow-glow-primary/10"
                              : "border-border/5 bg-surface-bg text-ink-secondary hover:bg-surface-glass"
                              }`}
                          >
                            <Icon size={32} />
                            <span className="font-bold">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <span className="block font-bold text-ink">Condition</span>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: "new", label: "New" },
                          { value: "good", label: "Good" },
                          { value: "used", label: "Used" }
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setForm({ ...form, condition: value as any })}
                            className={`rounded-xl border py-3 font-bold transition-all ${form.condition === value
                              ? "border-primary bg-primary text-white"
                              : "border-border/10 bg-surface-bg text-ink-secondary hover:border-white/20"
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={nextStep}
                    disabled={!form.title}
                    className="btn-primary w-full py-4 text-lg justify-center disabled:opacity-50"
                  >
                    Continue to Details
                    <ChevronRight size={20} />
                  </button>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6 rounded-2xl border border-border/5 bg-surface-bg p-8 shadow-soft">
                    <div className="space-y-6">
                      <label className="space-y-3">
                        <span className="font-bold text-ink">Price (₹) *</span>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={20} />
                          <input
                            type="number"
                            value={form.price}
                            onChange={(e) => setForm({ ...form, price: e.target.value })}
                            placeholder="500"
                            className="input-base pl-12"
                          />
                        </div>
                      </label>

                      <div className="space-y-3">
                        <span className="font-bold text-ink">Location *</span>
                        <LocationPicker
                          onSelectLocation={(location) => setForm({ ...form, location, college: location.address })}
                          savedLocations={savedLocations}
                          defaultLocation={form.location}
                          allowMultiple={true}
                        />
                      </div>
                    </div>

                    <label className="block space-y-3">
                      <span className="font-bold text-ink">Description *</span>
                      <textarea
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        rows={6}
                        placeholder="Tell buyers more about the item..."
                        className="input-base resize-none"
                      />
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={prevStep} className="btn-secondary flex-1 py-4 justify-center">
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={!form.price || !form.location || !form.description}
                      className="btn-primary flex-[2] py-4 justify-center disabled:opacity-50"
                    >
                      Next: Add Photos
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="space-y-6"
                >
                  {/* Mobile compact preview */}
                  {previews[0] && (
                    <div className="flex items-center gap-3 rounded-2xl border border-border/10 bg-white p-3 shadow-soft lg:hidden dark:bg-white/10">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image src={previews[0]} alt="Preview" fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-ink text-sm">{form.title || "Your Item"}</p>
                        <p className="text-orange-500 font-black">₹{form.price || "0"}</p>
                        <p className="text-xs text-ink-tertiary">{previews.length} photo{previews.length !== 1 ? "s" : ""} added</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-5 rounded-2xl border border-border/5 bg-surface-bg p-5 shadow-soft sm:p-8">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative aspect-square overflow-hidden rounded-2xl border border-border/10 group">
                          <Image src={src} alt="Preview" fill className="object-cover" />
                          <button
                            onClick={() => removeFile(idx)}
                            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}

                      {files.length < 6 && (
                        <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/10 bg-surface-bg transition-all hover:border-primary hover:bg-primary/5">
                          <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                          <Camera size={28} className="text-primary" />
                          <span className="text-xs font-bold text-ink-tertiary text-center px-1">Add Photo<br />({files.length}/6)</span>
                        </label>
                      )}
                    </div>

                    <div className="rounded-xl bg-primary/5 p-3 flex items-start gap-3 sm:p-4">
                      <ShieldCheck className="text-primary shrink-0 mt-0.5" size={18} />
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        Clear photos (max 10MB each) help your item sell 3x faster. You can add up to 6 images.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button onClick={prevStep} className="btn-secondary flex-1 py-4 justify-center">
                      <ChevronLeft size={20} />
                      Back
                    </button>
                    <button
                      onClick={handlePublish}
                      disabled={completion < 100 || isPublishing}
                      className="btn-primary flex-[2] py-4 justify-center disabled:opacity-50 gap-3"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 size={20} className="animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Upload size={20} />
                          Publish Listing
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Real-time Preview */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center gap-2 px-1">
                <CheckCircle2 size={18} className="text-primary" />
                <span className="text-sm font-bold text-ink">Live Preview</span>
              </div>

              <div className="overflow-hidden rounded-3xl border border-border/10 bg-surface-bg shadow-2xl">
                <div className="relative aspect-[4/3] bg-surface-secondary">
                  {previews[0] ? (
                    <Image src={previews[0]} alt="Preview" fill className="object-cover" />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-tertiary">
                      <ImagePlus size={48} strokeWidth={1} />
                      <span className="text-xs font-bold uppercase tracking-widest">Main Photo</span>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black text-white backdrop-blur-md">
                    PREVIEW
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <span className="rounded-lg bg-primary-light px-2.5 py-1 text-[10px] font-black text-primary uppercase">
                      {form.category}
                    </span>
                    <span className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[10px] font-black text-zinc-400 uppercase">
                      {form.condition}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="line-clamp-1 font-black text-ink text-xl">
                      {form.title || "Your Item Title"}
                    </h3>
                    <p className="text-2xl font-black text-primary">₹{form.price || "0"}</p>
                  </div>

                  <p className="line-clamp-2 text-sm text-ink-secondary leading-relaxed min-h-[40px]">
                    {form.description || "Describe your item here..."}
                  </p>

                  <div className="flex items-center gap-2 border-t border-border/5 pt-4 text-xs font-bold text-ink-tertiary min-w-0 overflow-hidden">
                    <MapPin size={14} className="text-primary shrink-0" />
                    <span className="truncate" title={form.location?.address || "Pick a location"}>{form.location?.address || "Pick a location"}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
