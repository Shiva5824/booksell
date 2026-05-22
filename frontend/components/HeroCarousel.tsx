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

export default function HeroCarousel() {
  const [images, setImages] = useState<CarouselImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const autoSlideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartRef = useRef<number | null>(null);

  const defaultImage = "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1400&auto=format&fit=crop";

  useEffect(() => {
    loadImages();
  }, []);

  async function loadImages() {
    try {
      const data = await getCarouselMedia();
      if (data && data.length > 0) {
        setImages(data);
      }
    } catch (error) {
      console.error("Failed to load carousel images:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (images.length === 0 || isHovering) {
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current);
      }
      return;
    }

    autoSlideTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % (images.length || 1));
    }, 2000);

    return () => {
      if (autoSlideTimeoutRef.current) {
        clearTimeout(autoSlideTimeoutRef.current);
      }
    };
  }, [images, currentIndex, isHovering]);

  const currentImage = images.length > 0 ? images[currentIndex] : null;
  const displayImage = currentImage?.imageUrl || defaultImage;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + (images.length || 1)) % (images.length || 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % (images.length || 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStartRef.current - touchEnd;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    touchStartRef.current = null;
  };

  if (loading) {
    return (
      <div className="relative hidden lg:block min-h-[610px] bg-gray-200 rounded-[34px] animate-pulse" />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 42 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, type: "spring", bounce: 0.28 }}
      className="relative hidden lg:block min-h-[610px]"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative background */}
      <div className="absolute -left-5 -top-5 h-32 w-32 rounded-full bg-orange-200 blur-3xl" />

      {/* Carousel container */}
      <div className="relative h-[610px] w-full overflow-hidden rounded-[34px] shadow-2xl">
        <AnimatePresence mode="sync">
          <motion.img
            key={currentIndex}
            src={displayImage}
            alt={currentImage?.title || "Carousel image"}
            className="absolute h-full w-full object-cover"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <button
            onClick={goToPrevious}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white transition-all duration-200 active:scale-90 backdrop-blur-sm"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white transition-all duration-200 active:scale-90 backdrop-blur-sm"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Hover state to show buttons */}
        {(isHovering || images.length > 1) && (
          <div className="absolute inset-0 flex items-center justify-between px-4">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0 }}
              onClick={goToPrevious}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white transition-all duration-200 active:scale-90 backdrop-blur-sm z-10"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </motion.button>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovering ? 1 : 0 }}
              onClick={goToNext}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink hover:bg-white transition-all duration-200 active:scale-90 backdrop-blur-sm z-10"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </motion.button>
          </div>
        )}

        {/* Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "bg-white w-8 h-2"
                    : "bg-white/40 w-2 h-2 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="absolute bottom-5 left-5 right-5 rounded-[26px] bg-white/95 p-5 shadow-soft-lg backdrop-blur-md dark:bg-slate-950/90">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-orange-500">Campus-ready</p>
        <p className="mt-2 text-lg font-black text-ink leading-snug">
          {currentImage?.title || "Engineering & Medical prep books from real student listings."}
        </p>
        {currentImage?.description && (
          <p className="mt-1 text-sm text-ink-secondary">{currentImage.description}</p>
        )}
      </div>
    </motion.div>
  );
}
