"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BadgeIndianRupee,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cpu,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Stethoscope,
  FlaskConical,
  Navigation,
  Check,
  Compass,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { toggleFavorite as apiToggleFavorite, getFavorites } from "@/services/api";
import type { Product, User } from "@/lib/types";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0
  })
};

interface ProductDetailClientProps {
  product: Product;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { dbUser, user } = useAuth();
  const router = useRouter();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Fullscreen gallery state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxDirection, setLightboxDirection] = useState(0);

  const paginateLightbox = (newDirection: number) => {
    setLightboxDirection(newDirection);
    if (newDirection > 0) {
      setLightboxIdx((prev) => (prev < product.images.length - 1 ? prev + 1 : 0));
    } else {
      setLightboxIdx((prev) => (prev > 0 ? prev - 1 : product.images.length - 1));
    }
  };
  
  // Geolocation and distance state
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number; label: string } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSource, setLocationSource] = useState<"none" | "saved" | "gps">("none");

  // Determine seller profile
  const seller = useMemo(() => {
    return typeof product.sellerId === "string"
      ? ({ _id: product.sellerId, name: "Verified Seller", email: "", college: product.college } as User)
      : (product.sellerId as User);
  }, [product.sellerId, product.college]);

  // Clean WhatsApp number and format
  const whatsappUrl = useMemo(() => {
    if (!seller || !seller.phone) return null;
    
    // Clean all non-digit characters
    let cleaned = seller.phone.replace(/\D/g, "");
    
    // If it's a standard Indian phone number without country code (10 digits), prepend 91
    if (cleaned.length === 10) {
      cleaned = `91${cleaned}`;
    }
    
    const text = encodeURIComponent(
      `Hi ${seller.name || "there"}, I saw your listing for "${product.title}" on SellChey. Is it still available?`
    );
    return `https://wa.me/${cleaned}?text=${text}`;
  }, [seller, product.title]);

  // Initialize isSaved from user's favorites list
  useEffect(() => {
    if (!user) return;
    getFavorites().then((favs) => {
      setIsSaved(favs.some((f) => f._id === product._id));
    });
  }, [user, product._id]);

  // Set initial user location from dbUser's default location
  useEffect(() => {
    if (dbUser?.locations && dbUser.locations.length > 0) {
      const defaultLoc = dbUser.locations.find((loc: any) => loc.isDefault) || dbUser.locations[0];
      setUserLocation({
        latitude: defaultLoc.latitude,
        longitude: defaultLoc.longitude,
        label: defaultLoc.label || "Default Address"
      });
      setLocationSource("saved");
    }
  }, [dbUser]);

  // Keyboard navigation for fullscreen lightbox modal
  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setLightboxOpen(false);
      } else if (e.key === "ArrowLeft") {
        paginateLightbox(-1);
      } else if (e.key === "ArrowRight") {
        paginateLightbox(1);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, product.images.length]);

  // Lock body scroll when fullscreen gallery is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  // Handle favorite toggle
  async function handleFavoriteToggle() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (togglingFav) return;
    setTogglingFav(true);
    const optimisticValue = !isSaved;
    setIsSaved(optimisticValue);
    try {
      await apiToggleFavorite(product._id);
    } catch (err) {
      console.error("Failed to toggle favorite:", err);
      setIsSaved(!optimisticValue); // revert on error
    } finally {
      setTogglingFav(false);
    }
  }

  // Haversine formula to calculate distance in km
  const distance = useMemo(() => {
    if (!product.location || !userLocation) return null;
    
    const lat1 = product.location.latitude;
    const lon1 = product.location.longitude;
    const lat2 = userLocation.latitude;
    const lon2 = userLocation.longitude;

    if (lat1 === lat2 && lon1 === lon2) return 0;

    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [product.location, userLocation]);

  // Format distance for UI
  const formattedDistance = useMemo(() => {
    if (distance === null) return null;
    if (distance < 0.1) {
      return "Very close (less than 100 meters)";
    }
    if (distance < 1) {
      return `${Math.round(distance * 1000)} meters away`;
    }
    return `${distance.toFixed(1)} km away`;
  }, [distance]);

  // Handle browser GPS detection
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: "Current Location"
        });
        setLocationSource("gps");
        setIsLocating(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert(`Could not get current location: ${error.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  // Copy listing link to clipboard
  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const CategoryIcon = (() => {
    switch (product.category) {
      case "ipe": return BookOpen;
      case "eapcet": return FlaskConical;
      case "jee": return Cpu;
      case "neet": return Stethoscope;
      default: return BookOpen;
    }
  })();

  const postedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(product.createdAt));

  return (
    <>
      <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-nav">
      <div className="mx-auto max-w-7xl px-4 py-8">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-border/10 bg-surface-bg px-4 py-2.5 text-sm font-bold text-ink-secondary hover:text-ink hover:border-border/30 hover:bg-surface-tertiary transition-all"
          >
            <ArrowLeft size={16} />
            Back to Listings
          </Link>
        </div>

        {/* Responsive Grid */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* LEFT SIDE: Image Gallery & Description (7 cols on desktop) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Gallery Wrapper */}
            <div className="relative overflow-hidden rounded-[32px] border border-border/10 bg-slate-950/5 aspect-[4/3] shadow-soft group dark:bg-slate-900/10">
              
              {/* Main Active Image with transitions */}
              <div 
                className="relative w-full h-full cursor-pointer overflow-hidden"
                onClick={() => {
                  setLightboxIdx(activeImageIdx);
                  setLightboxOpen(true);
                }}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    {/* Blurred background image to fill sides */}
                    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                      <Image
                        src={product.images[activeImageIdx]}
                        alt=""
                        fill
                        className="object-cover blur-3xl scale-125 opacity-85"
                        sizes="20vw"
                      />
                      <div className="absolute inset-0 bg-black/[0.03] dark:bg-black/25 z-10 pointer-events-none" />
                    </div>
                    
                    {/* Ambient shadow gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none z-10" />

                    {/* Main sharp image focused in front */}
                    <Image
                      src={product.images[activeImageIdx]}
                      alt={product.title}
                      fill
                      priority
                      className="z-20 object-contain transition-all duration-500 hover:scale-[1.02]"
                      sizes="(max-width: 1024px) 100vw, 55vw"
                    />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-ink-tertiary">
                    <ImageIcon size={64} />
                  </div>
                )}
              </div>

              {/* Status and Action overlays */}
              <div className="absolute top-4 left-4 z-30 flex gap-2">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider text-white shadow-soft ${
                    product.status === "sold" ? "bg-slate-900" : "bg-orange-500"
                  }`}
                >
                  {product.status === "sold" ? "Sold Out" : "Available"}
                </span>
                <span className="rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-500 shadow-soft backdrop-blur-md dark:bg-slate-900/90">
                  {product.condition}
                </span>
              </div>

              {/* Share & Save overlays */}
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleFavoriteToggle}
                  disabled={togglingFav}
                  className={`flex h-11 w-11 items-center justify-center rounded-full shadow-soft backdrop-blur-md transition-all disabled:opacity-70 ${
                    isSaved
                      ? "bg-orange-500 text-white"
                      : "bg-white/90 text-ink hover:text-orange-500 dark:bg-slate-900/90"
                  }`}
                  aria-label={isSaved ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart size={20} className={isSaved ? "fill-white text-white" : ""} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur-md transition-colors hover:text-primary dark:bg-slate-900/90"
                  aria-label="Share listing"
                >
                  {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
                </motion.button>
              </div>

              {/* Image index overlay */}
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 z-30 rounded-full bg-slate-950/60 px-3.5 py-1.5 text-xs font-black text-white backdrop-blur-md">
                  {activeImageIdx + 1} / {product.images.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 bg-surface-secondary transition-all ${
                      idx === activeImageIdx
                        ? "border-orange-500 scale-95 shadow-glow-primary/20"
                        : "border-border/10 hover:border-border/40"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} - ${idx + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Mobile-only Header: Title, Price, Specs & Actions */}
            <div className="block lg:hidden bg-white dark:bg-white/5 rounded-[32px] border border-border/10 p-5 sm:p-6 shadow-soft space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3.5 py-1.5 text-xs font-black text-orange-500 uppercase tracking-wider dark:bg-orange-500/15">
                  <CategoryIcon size={14} />
                  {product.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f2ee] px-3.5 py-1.5 text-xs font-black text-ink-secondary uppercase tracking-wider dark:bg-white/10">
                  <Clock3 size={14} />
                  {postedDate}
                </span>
              </div>

              {/* Title & Price */}
              <div className="space-y-3">
                <h1 className="text-2xl font-black leading-tight text-ink">
                  {product.title}
                </h1>
                <div className="inline-flex items-center gap-1.5 text-3xl font-black text-orange-500">
                  <BadgeIndianRupee size={32} className="stroke-[2.5]" />
                  <span>{product.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Fast Spec Pills */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                <div className="rounded-2xl bg-[#f5f2ee] dark:bg-white/5 p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Condition</p>
                  <p className="text-xs sm:text-sm font-black text-ink capitalize">{product.condition}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f2ee] dark:bg-white/5 p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Section</p>
                  <p className="text-xs sm:text-sm font-black text-ink uppercase">{product.category}</p>
                </div>
                <div className="rounded-2xl bg-[#f5f2ee] dark:bg-white/5 p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Colleges</p>
                  <p className="text-xs sm:text-sm font-black text-ink truncate max-w-full" title={product.college}>{product.college}</p>
                </div>
              </div>

              {/* Seller Profile mini card */}
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#f5f2ee] dark:bg-white/5 border border-border/5">
                <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-border/10 shadow-inner shrink-0 bg-surface-tertiary">
                  <Image
                    src={seller.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"}
                    alt={seller.name || "Seller"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-ink text-sm truncate">
                      {seller.name || "Verified Campus Seller"}
                    </p>
                    <CheckCircle2 size={14} className="text-orange-500 shrink-0" />
                  </div>
                  <p className="text-[10px] text-ink-tertiary font-bold truncate">
                    {seller.college || product.college}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid gap-3 pt-2">
                <Link
                  href={`/chat?product=${product._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-soft transition-all duration-300 hover:bg-slate-800 active:scale-[0.98]"
                >
                  <MessageCircle size={20} className="stroke-[2.5]" />
                  Message on Chat
                </Link>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-bold text-white shadow-soft hover:shadow-glow-primary/10 transition-all duration-300 hover:bg-[#20ba59] active:scale-[0.98]"
                  >
                    <Phone size={20} className="fill-white stroke-none" />
                    Chat on WhatsApp
                  </a>
                ) : (
                  <div className="w-full py-3.5 text-center text-xs font-bold text-ink-tertiary bg-surface-tertiary rounded-xl border border-dashed border-border/10">
                    Seller WhatsApp not available
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="rounded-[32px] border border-border/10 bg-surface-bg p-6 sm:p-8 shadow-soft">
              <h2 className="text-xl font-black text-ink mb-4 sm:text-2xl">Item Description</h2>
              <div className="h-px bg-border/5 mb-6" />
              <p className="text-base sm:text-lg leading-relaxed text-ink-secondary whitespace-pre-line">
                {product.description || "No description provided."}
              </p>
            </div>
            
            {/* Campus Safety Tips */}
            <div className="rounded-[32px] border border-border/5 bg-primary/5 p-6 sm:p-8 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-orange-500" size={24} />
                <h3 className="text-lg font-black text-ink">Campus Safety Guidelines</h3>
              </div>
              <ul className="space-y-3 text-sm text-ink-secondary font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Meet inside the college campus or at designated public areas like library or canteen.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Inspect the condition of the book, notes, or device carefully before transferring payment.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">•</span>
                  <span>Prefer digital campus wallet transfers or cash only after receiving your item.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Info, Geolocation, Seller Details (5 cols on desktop) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Main Info Card */}
            <div className="hidden lg:block rounded-[32px] border border-border/10 bg-surface-bg p-6 sm:p-8 shadow-soft space-y-6">
              
              {/* Top Row Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3.5 py-1.5 text-xs font-black text-orange-500 uppercase tracking-wider dark:bg-orange-500/15">
                  <CategoryIcon size={14} />
                  {product.category}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5f2ee] px-3.5 py-1.5 text-xs font-black text-ink-secondary uppercase tracking-wider dark:bg-white/10">
                  <Clock3 size={14} />
                  {postedDate}
                </span>
              </div>

              {/* Title & Price */}
              <div className="space-y-3">
                <h1 className="text-2xl font-black leading-tight text-ink sm:text-3xl">
                  {product.title}
                </h1>
                <div className="inline-flex items-center gap-1.5 text-3xl font-black text-orange-500 sm:text-4xl">
                  <BadgeIndianRupee size={32} className="stroke-[2.5]" />
                  <span>{product.price.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Fast Spec Pills */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="rounded-2xl bg-surface-tertiary p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Condition</p>
                  <p className="text-sm font-black text-ink capitalize">{product.condition}</p>
                </div>
                <div className="rounded-2xl bg-surface-tertiary p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Section</p>
                  <p className="text-sm font-black text-ink uppercase">{product.category}</p>
                </div>
                <div className="rounded-2xl bg-surface-tertiary p-3 text-center border border-border/5">
                  <p className="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider mb-1">Colleges</p>
                  <p className="text-sm font-black text-ink truncate max-w-full" title={product.college}>{product.college}</p>
                </div>
              </div>
            </div>

            {/* Address & Geolocation Calculator */}
            {product.location ? (
              <div className="rounded-[32px] border border-border/10 bg-surface-bg p-6 sm:p-8 shadow-soft space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-ink flex items-center gap-2">
                    <MapPin size={20} className="text-orange-500" />
                    Pickup Location
                  </h3>
                  {locationSource === "gps" && (
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Live GPS
                    </span>
                  )}
                </div>

                <div className="rounded-2xl bg-surface-tertiary p-4 border border-border/5">
                  <p className="font-bold text-sm text-ink mb-1">Listing Address</p>
                  <p className="text-xs font-semibold text-ink-secondary leading-relaxed">
                    {product.location.address}
                  </p>
                </div>

                {/* Distance display with calculations */}
                <div className="space-y-4 pt-2">
                  {userLocation ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                      <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                        <Compass className="animate-wiggle" size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-ink-tertiary">Distance from {userLocation.label}</p>
                        <p className="text-base font-black text-orange-500 mt-0.5">
                          {formattedDistance || "Calculating distance..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-ink-tertiary italic">
                      Sign in or enable GPS to calculate your distance to this item.
                    </p>
                  )}

                  {/* Actions for location updates */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={detectGPSLocation}
                      disabled={isLocating}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-surface-tertiary border border-border/10 py-3 text-xs font-bold text-ink hover:bg-surface-tertiary-alt active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {isLocating ? (
                        <>
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                          Locating...
                        </>
                      ) : (
                        <>
                          <Navigation size={14} className="text-orange-500" />
                          Compare via Live GPS
                        </>
                      )}
                    </button>

                    {dbUser?.locations && dbUser.locations.length > 0 && locationSource !== "saved" && (
                      <button
                        onClick={() => {
                          const defaultLoc = dbUser.locations.find((loc: any) => loc.isDefault) || dbUser.locations[0];
                          setUserLocation({
                            latitude: defaultLoc.latitude,
                            longitude: defaultLoc.longitude,
                            label: defaultLoc.label || "Saved Address"
                          });
                          setLocationSource("saved");
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-surface-tertiary border border-border/10 py-3 text-xs font-bold text-ink hover:bg-surface-tertiary-alt active:scale-[0.98] transition-all"
                      >
                        <MapPin size={14} className="text-orange-500" />
                        Use Default Address
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[32px] border border-border/10 bg-surface-bg p-6 sm:p-8 shadow-soft text-center space-y-3">
                <MapPin size={28} className="text-ink-tertiary mx-auto" />
                <p className="font-bold text-ink text-sm">Pickup location not set on map</p>
                <p className="text-xs text-ink-tertiary leading-relaxed">
                  The seller did not specify map coordinates. Meet inside {product.college}.
                </p>
              </div>
            )}

            {/* Seller Contact Card */}
            <div className="hidden lg:block rounded-[32px] border border-border/10 bg-surface-bg p-6 sm:p-8 shadow-soft space-y-6">
              
              {/* Seller profile information */}
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-border/10 shadow-inner shrink-0 bg-surface-tertiary">
                  <Image
                    src={seller.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"}
                    alt={seller.name || "Seller"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-black text-ink text-base truncate" title={seller.name}>
                      {seller.name || "Verified Campus Seller"}
                    </p>
                    <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                  </div>
                  <p className="text-xs text-ink-tertiary font-bold mt-1 truncate" title={seller.college}>
                    {seller.college || product.college}
                  </p>
                </div>
              </div>

              {/* Trust badges */}
              <div className="rounded-2xl bg-surface-tertiary p-4 space-y-2.5 border border-border/5">
                <div className="flex items-center gap-2.5 text-xs font-bold text-ink-secondary">
                  <ShieldCheck size={16} className="text-orange-500 shrink-0" />
                  <span>Trusted College Peer verified on SellChey</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs font-bold text-ink-secondary">
                  <CheckCircle2 size={16} className="text-orange-500 shrink-0" />
                  <span>Coordinates verified for quick campus swap</span>
                </div>
              </div>

              {/* Interactive Contact Actions */}
              <div className="grid gap-3">
                <Link
                  href={`/chat?product=${product._id}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 font-bold text-white shadow-soft transition-all duration-300 hover:bg-slate-800 active:scale-[0.98]"
                >
                  <MessageCircle size={20} className="stroke-[2.5]" />
                  Message on Chat
                </Link>

                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-bold text-white shadow-soft hover:shadow-glow-primary/10 transition-all duration-300 hover:bg-[#20ba59] active:scale-[0.98]"
                  >
                    <Phone size={20} className="fill-white stroke-none" />
                    Chat on WhatsApp
                  </a>
                ) : (
                  <div className="w-full py-3.5 text-center text-xs font-bold text-ink-tertiary bg-surface-tertiary rounded-xl border border-dashed border-border/10">
                    Seller WhatsApp not available
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </main>

    {/* Fullscreen Lightbox Modal */}
    <AnimatePresence>
      {lightboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col justify-between py-6 px-4 touch-none select-none"
        >
          {/* Top Bar */}
          <div className="flex w-full items-center justify-between z-20 px-4 md:px-8">
            <span className="text-white/80 font-black text-sm bg-white/10 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md">
              {lightboxIdx + 1} / {product.images.length}
            </span>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLightboxOpen(false)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/5 cursor-pointer"
              aria-label="Close fullscreen gallery"
            >
              <X size={20} />
            </motion.button>
          </div>

          {/* Main Stage */}
          <div className="relative flex-1 w-full flex items-center justify-center my-4 overflow-hidden">
            {/* Blurred background image to fill sides in fullscreen */}
            <div className="absolute inset-0 scale-125 blur-3xl opacity-60 pointer-events-none overflow-hidden">
              <Image
                src={product.images[lightboxIdx]}
                alt=""
                fill
                className="object-cover"
                sizes="30vw"
              />
              <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Foreground main image slider */}
            <div className="relative w-full h-full max-h-[70vh] flex items-center justify-center z-10 px-4 md:px-16 overflow-hidden">
              <AnimatePresence initial={false} custom={lightboxDirection}>
                <motion.div
                  key={lightboxIdx}
                  custom={lightboxDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, info) => {
                    const swipeThreshold = 50;
                    if (info.offset.x < -swipeThreshold) {
                      paginateLightbox(1);
                    } else if (info.offset.x > swipeThreshold) {
                      paginateLightbox(-1);
                    }
                  }}
                  className="absolute inset-0 flex items-center justify-center px-4 md:px-16 pointer-events-auto"
                >
                  <div className="relative w-full h-full max-h-[70vh]">
                    <Image
                      src={product.images[lightboxIdx]}
                      alt={product.title}
                      fill
                      priority
                      className="object-contain select-none pointer-events-none"
                      sizes="100vw"
                    />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation Controls (Arrows) */}
            {product.images.length > 1 && (
              <>
                {/* Left Arrow */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    paginateLightbox(-1);
                  }}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/5 z-20 cursor-pointer shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </motion.button>

                {/* Right Arrow */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    paginateLightbox(1);
                  }}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 border border-white/5 z-20 cursor-pointer shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </motion.button>
              </>
            )}
          </div>

          {/* Scrolling Thumbnails bottom bar */}
          {product.images.length > 1 && (
            <div className="w-full flex justify-center z-20 px-4">
              <div className="flex gap-3 overflow-x-auto max-w-full py-3 px-4 bg-white/5 border border-white/5 backdrop-blur-md rounded-2xl scrollbar-hide">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLightboxDirection(idx > lightboxIdx ? 1 : -1);
                      setLightboxIdx(idx);
                    }}
                    className={`relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                      idx === lightboxIdx
                        ? "border-orange-500 scale-95 shadow-md shadow-orange-500/25"
                        : "border-transparent opacity-40 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover pointer-events-none select-none"
                      sizes="56px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
