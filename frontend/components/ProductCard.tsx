"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee,
  BookOpen,
  Clock3,
  Cpu,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  UserRound,
} from "lucide-react";
import type { Product, User } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const sold = product.status === "sold";
  const Icon = product.category === "book" ? BookOpen : Cpu;
  const seller = typeof product.sellerId === "string" ? null : (product.sellerId as User);
  const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(product.createdAt));

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group overflow-hidden rounded-2xl surface transition-all duration-500 hover:-translate-y-2 hover:shadow-soft-lg"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-secondary">
        <Link href={`/product/${product._id}`} aria-label={`View ${product.title}`}>
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-smooth duration-500 pointer-events-none" />

        {/* Status Badges */}
        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className={`rounded-xl px-2.5 py-1 text-xs font-bold transition-smooth ${
            sold 
              ? "bg-surface-elevated text-ink-secondary border border-border" 
              : "bg-primary text-white shadow-soft"
          }`}>
            {sold ? "Sold Out" : "Available"}
          </span>
          {product.condition && (
            <span className="rounded-xl glass px-2.5 py-1 text-xs font-semibold text-accent border-accent/20">
              {product.condition}
            </span>
          )}
        </div>

        {/* Image Count */}
        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-xl glass px-2.5 py-1 text-xs font-semibold text-ink shadow-soft">
          <ImageIcon size={14} />
          {product.images.length}
        </span>

        {/* Wishlist Button */}
        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          aria-label="Save listing"
          className="absolute right-3 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl glass text-ink shadow-soft transition-colors hover:text-secondary hover:bg-surface-glass"
        >
          <Heart size={20} className="transition-all duration-300 group-hover:fill-secondary/20" />
        </motion.button>

        {/* Sold Overlay */}
        {sold && (
          <div className="pointer-events-none absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-white text-2xl font-black tracking-widest border-4 border-white/20 rounded-xl px-6 py-2 rotate-[-10deg]"
            >
              SOLD
            </motion.div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-3">
          <Link href={`/product/${product._id}`} className="min-w-0 flex-1">
            <h3 className="line-clamp-2 min-h-12 text-lg font-bold leading-tight text-ink group-hover:text-primary transition-colors">
              {product.title}
            </h3>
          </Link>
          <div className="flex shrink-0 flex-col items-end">
            <span className="flex items-center gap-0.5 font-black text-ink text-xl">
              <BadgeIndianRupee size={18} className="text-primary" />
              {product.price.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Category and Condition Tags */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-tertiary px-2.5 py-1 text-xs font-semibold text-primary border border-primary/10">
            <Icon size={14} />
            <span className="capitalize">{product.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-ink-secondary bg-surface-secondary rounded-lg px-2.5 py-1 truncate max-w-[150px]">
            <MapPin size={14} className="shrink-0 text-ink-tertiary" />
            {product.college}
          </span>
        </div>

        {/* Seller Info & Contact */}
        <div className="flex items-center justify-between gap-3 border-t border-border/50 pt-4 mt-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-soft">
              <UserRound size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-ink truncate max-w-[100px]">{seller?.name || "Verified seller"}</span>
              <span className="text-[10px] font-semibold text-ink-tertiary flex items-center gap-1">
                <Clock3 size={10} />
                {dateLabel}
              </span>
            </div>
          </div>
          <Link
            href={`/chat?product=${product._id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-glow-primary active:scale-95"
          >
            <MessageCircle size={16} />
            <span className="hidden sm:inline">Contact</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
