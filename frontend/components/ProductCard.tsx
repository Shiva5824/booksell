"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee, BookOpen, Clock3, Cpu, FlaskConical,
  Heart, Image as ImageIcon, MapPin, MessageCircle, Navigation,
  UserRound, Stethoscope,
} from "lucide-react";
import type { Product, User } from "@/lib/types";
import { formatDistance } from "@/lib/useUserLocation";

interface ProductCardProps {
  product: Product;
  isFavorited?: boolean;
  onToggleFavorite?: (productId: string) => void;
  /** Distance to listing in kilometers (when sorting by nearest). */
  distanceKm?: number | null;
}

export default function ProductCard({ product, isFavorited = false, onToggleFavorite, distanceKm }: ProductCardProps) {
  const router = useRouter();
  const sold = product.status === "sold";

  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!isHovered || !product.images || product.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % product.images.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isHovered, product.images]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImageIdx(0);
  };
  const Icon = (() => {
    switch (product.category) {
      case "ipe": return BookOpen;
      case "eapcet": return FlaskConical;
      case "jee": return Cpu;
      case "neet": return Stethoscope;
      default: return BookOpen;
    }
  })();
  const seller = typeof product.sellerId === "string" ? null : (product.sellerId as User);
  const dateObj = new Date(product.createdAt);
  const dateLabel = new Intl.DateTimeFormat("en-IN", { 
    day: "numeric", 
    month: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: true 
  }).format(dateObj).replace(" at ", ", ");

  function handleHeartClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(product._id);
    } else {
      router.push("/login");
    }
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group overflow-hidden rounded-[28px] bg-white shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-soft-lg dark:bg-white/10"
    >
      {/* Image */}
      <div 
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative aspect-[4/3] overflow-hidden bg-slate-950/5 dark:bg-slate-900/10 cursor-pointer"
      >
        <Link href={`/product/${product._id}`} aria-label={`View ${product.title}`}>
          {product.images && product.images.length > 0 ? (
            <>
              {/* Blurred background image to fill sides */}
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                <Image
                  src={product.images[currentImageIdx]}
                  alt=""
                  fill
                  className="object-cover blur-2xl scale-125 opacity-70 transition-all duration-300"
                  sizes="10vw"
                />
                <div className="absolute inset-0 bg-black/[0.03] dark:bg-black/20" />
              </div>

              {/* Ambient shadow gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none z-10 transition-opacity duration-300" />

              {/* Main sharp image focused in front */}
              <Image
                src={product.images[currentImageIdx]}
                alt={product.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="z-10 object-contain transition-transform duration-500 hover:scale-[1.02]"
              />
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-ink-tertiary">
              <ImageIcon size={48} />
            </div>
          )}
        </Link>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

        {/* Top-left badges. Wraps to a second line on small screens so the
            "Available", "condition", and distance pills never collide with
            the image-counter pill in the top-right. */}
        <div className="absolute left-2 right-12 top-2 z-20 flex flex-wrap gap-1 sm:left-3 sm:right-14 sm:top-3 sm:gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black sm:px-3 sm:py-1 sm:text-xs ${sold ? "bg-white text-ink-secondary border border-border/10" : "bg-orange-500 text-white shadow-soft"}`}>
            {sold ? "Sold Out" : "Available"}
          </span>
          {product.condition && (
            <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-orange-500 shadow-soft backdrop-blur sm:px-3 sm:py-1 sm:text-xs">
              {product.condition}
            </span>
          )}
          {typeof distanceKm === "number" && (
            <span className="flex items-center gap-0.5 rounded-full bg-slate-900/90 px-2 py-0.5 text-[10px] font-black text-white shadow-soft backdrop-blur sm:gap-1 sm:px-2.5 sm:py-1 sm:text-[11px]">
              <Navigation size={9} className="sm:hidden" />
              <Navigation size={10} className="hidden sm:inline" />
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>

        <span className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-ink shadow-soft backdrop-blur sm:right-3 sm:top-3 sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs">
          <ImageIcon size={11} className="sm:hidden" />
          <ImageIcon size={13} className="hidden sm:inline" />
          {product.images.length}
        </span>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          onClick={handleHeartClick}
          aria-label={isFavorited ? "Remove from favourites" : "Add to favourites"}
          className={`absolute right-3 bottom-3 z-20 flex h-11 w-11 items-center justify-center rounded-full shadow-soft transition-colors ${
            isFavorited
              ? "bg-orange-500 text-white"
              : "bg-white/90 text-slate-800 hover:text-orange-500 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:text-orange-500"
          }`}
        >
          <Heart
            size={19}
            className={`transition-all duration-300 ${
              isFavorited ? "fill-white text-white" : "group-hover:fill-orange-500/15"
            }`}
          />
        </motion.button>

        {sold && (
          <div className="pointer-events-none absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white text-2xl font-black tracking-widest border-4 border-white/25 rounded-xl px-6 py-2 rotate-[-10deg]"
            >
              SOLD
            </motion.div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${product._id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-[2.75rem] text-base font-bold leading-tight text-ink group-hover:text-primary transition-colors sm:text-lg">
              {product.title}
            </h3>
          </Link>
          <span className="flex shrink-0 items-center gap-0.5 font-black text-orange-500 text-lg sm:text-xl">
            <BadgeIndianRupee size={17} />
            {product.price.toLocaleString("en-IN")}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-black text-orange-500 dark:bg-orange-500/15">
            <Icon size={13} />
            <span className="uppercase tracking-wider">{product.category}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary bg-[#f5f2ee] rounded-full px-3 py-1 dark:bg-white/10 min-w-0 max-w-[160px] overflow-hidden">
            <MapPin size={13} className="shrink-0 text-ink-tertiary" />
            <span className="truncate">{product.location?.address || product.college}</span>
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {seller?.avatar ? (
              <Image 
                src={seller.avatar} 
                alt="" 
                width={24} 
                height={24} 
                className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full object-cover border border-border/10 shadow-sm" 
              />
            ) : (
              <div className="h-6 w-6 sm:h-7 sm:w-7 shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-soft dark:bg-orange-500">
                <UserRound size={11} />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-ink truncate max-w-[80px] sm:max-w-[90px]">{seller?.name?.split(" ")[0] || "Seller"}</span>
              <span className="text-[9px] sm:text-[10px] font-semibold text-ink-tertiary flex items-center gap-1">
                <Clock3 size={8} />{dateLabel.split(",")[0]}
              </span>
            </div>
          </div>
          <Link
            href={`/chat?product=${product._id}`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-[10px] font-black text-white transition-all duration-300 hover:bg-orange-500 active:scale-95 sm:px-4 sm:py-2 sm:text-xs"
          >
            <MessageCircle size={14} />
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
