"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeIndianRupee, BookOpen, Clock3, Cpu,
  Heart, Image as ImageIcon, MapPin, MessageCircle,
  UserRound, Smartphone, NotebookText,
} from "lucide-react";
import type { Product, User } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const sold = product.status === "sold";
  const Icon = (() => {
    switch (product.category) {
      case "book": return BookOpen;
      case "equipment": return Cpu;
      case "electronics": return Smartphone;
      case "notes": return NotebookText;
      default: return BookOpen;
    }
  })();
  const seller = typeof product.sellerId === "string" ? null : (product.sellerId as User);
  const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(product.createdAt));

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="group overflow-hidden rounded-[28px] bg-white shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-soft-lg dark:bg-white/10"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f2ee] dark:bg-white/10">
        <Link href={`/product/${product._id}`} aria-label={`View ${product.title}`}>
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

        <div className="absolute left-3 top-3 z-10 flex gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black ${sold ? "bg-white text-ink-secondary border border-border/10" : "bg-orange-500 text-white shadow-soft"}`}>
            {sold ? "Sold Out" : "Available"}
          </span>
          {product.condition && (
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-orange-500 shadow-soft backdrop-blur">
              {product.condition}
            </span>
          )}
        </div>

        <span className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-ink shadow-soft backdrop-blur">
          <ImageIcon size={13} />
          {product.images.length}
        </span>

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          type="button"
          aria-label="Save listing"
          className="absolute right-3 bottom-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/92 text-ink shadow-soft transition-colors hover:text-orange-500"
        >
          <Heart size={19} className="transition-all duration-300 group-hover:fill-orange-500/15" />
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
            <span className="capitalize">{product.category}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-secondary bg-[#f5f2ee] rounded-full px-3 py-1 truncate max-w-[160px] dark:bg-white/10">
            <MapPin size={13} className="shrink-0 text-ink-tertiary" />
            {product.college}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border/10 pt-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="h-7 w-7 shrink-0 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-soft dark:bg-orange-500">
              <UserRound size={13} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-ink truncate max-w-[90px]">{seller?.name || "Verified seller"}</span>
              <span className="text-[10px] font-semibold text-ink-tertiary flex items-center gap-1">
                <Clock3 size={9} />{dateLabel}
              </span>
            </div>
          </div>
          <Link
            href={`/chat?product=${product._id}`}
            className="flex items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-xs font-black text-white transition-all duration-300 hover:bg-orange-500 active:scale-95 sm:px-4 sm:text-sm"
          >
            <MessageCircle size={15} />
            <span>Contact</span>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
