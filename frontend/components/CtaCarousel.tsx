"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCarouselMedia } from "@/services/site";

interface CarouselImage {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  order: number;
}

/**
 * CtaCarousel — animated image carousel for the homepage "Save More on College
 * Essentials" CTA banner. Slot-sized: hidden on small screens, 280px tall on
 * tablets, 360px on desktop. Mirrors HeroCarousel behavior (auto-rotate every
 * 2s, pause on hover, manual nav, swipe on touch) but with no overlay info
 * box — the CTA copy lives next to it.
 */
export default function CtaCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSlideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);

  // Fallback static image used when the admin hasn't uploaded any CTA images.
  const defaultImage =
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1400&auto=format&fit=crop";

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getCarouselMedia("cta");
        if (mounted && data && data.length > 0) {
          setImages(data);
        }
      } catch (error) {
        console.error("Failed to load CTA carousel images:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Auto-advance every 2s, pause on hover.
  useEffect(() => {
    if (images.length <= 1 || isHovering) {
      if (autoSlideTimeoutRef.current) clearTimeout(autoSlideTimeoutRef.current);
      return;
    }
    autoSlideTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => {
      if (autoSlideTimeoutRef.current) clearTimeout(autoSlideTimeoutRef.current);
    };
  }, [images, currentIndex, isHovering]);

  const currentImage = images.length > 0 ? images[currentIndex] : null;
  const displayImage = currentImage?.imageUrl || defaultImage;

  const goToPrevious = () => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  const goToNext = () => {
    if (images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartRef.current == null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext(); else goToPrevious();
    }
    touchStartRef.current = null;
  };

  if (loading) {
    return (
      <div className="hidden h-[280px] w-full rounded-[24px] bg-slate-800/40 animate-pulse md:block lg:h-[360px]" />
    );
  }

  const hasMultiple = images.length > 1;

  return (
    <div
      className="group relative hidden h-[280px] w-full overflow-hidden rounded-[24px] shadow-2xl md:block lg:h-[360px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <AnimatePresence mode="sync">
        <motion.img
          key={currentImage?._id || `default-${currentIndex}`}
          src={displayImage}
          alt={currentImage?.title || "Stack of books"}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -80, opacity: 0 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
      </AnimatePresence>

      {/* Subtle gradient for legibility of any overlay copy + buttons. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {hasMultiple && (
        <>
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              onClick={goToPrevious}
              className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft hover:bg-white active:scale-90 backdrop-blur-sm"
              aria-label="Previous image"
            >
              <ChevronLeft size={18} />
            </motion.button>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0 }}
              transition={{ duration: 0.18 }}
              onClick={goToNext}
              className="z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink shadow-soft hover:bg-white active:scale-90 backdrop-blur-sm"
              aria-label="Next image"
            >
              <ChevronRight size={18} />
            </motion.button>
          </div>

          {/* Indicator pills */}
          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "h-1.5 w-6 bg-white"
                    : "h-1.5 w-1.5 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Optional caption — only shown if admin set a title for this slide. */}
      {currentImage?.title && (
        <div className="absolute left-4 right-16 bottom-3 z-10 max-w-[70%]">
          <p className="truncate text-sm font-black text-white drop-shadow-md">
            {currentImage.title}
          </p>
          {currentImage.description && (
            <p className="mt-0.5 truncate text-xs font-medium text-white/85 drop-shadow">
              {currentImage.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
