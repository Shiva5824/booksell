"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";

interface PriceRangeFilterProps {
  minPrice: number | null;
  maxPrice: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export default function PriceRangeFilter({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceRangeFilterProps) {
  const [showMinToggle, setShowMinToggle] = useState(minPrice !== null);
  const [showMaxToggle, setShowMaxToggle] = useState(maxPrice !== null);
  const [localMinPrice, setLocalMinPrice] = useState(minPrice?.toString() || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice?.toString() || "");

  const handleMinToggle = useCallback(() => {
    if (showMinToggle) {
      setShowMinToggle(false);
      setLocalMinPrice("");
      onMinChange(null);
    } else {
      setShowMinToggle(true);
    }
  }, [showMinToggle, onMinChange]);

  const handleMaxToggle = useCallback(() => {
    if (showMaxToggle) {
      setShowMaxToggle(false);
      setLocalMaxPrice("");
      onMaxChange(null);
    } else {
      setShowMaxToggle(true);
    }
  }, [showMaxToggle, onMaxChange]);

  const handleMinPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMinPrice(value);

      if (value === "") {
        onMinChange(null);
      } else {
        const numValue = Math.max(0, parseInt(value) || 0);
        
        // Ensure min is not greater than max
        if (maxPrice !== null && numValue > maxPrice) {
          onMaxChange(numValue);
          setLocalMaxPrice(numValue.toString());
        }
        
        onMinChange(numValue);
      }
    },
    [maxPrice, onMinChange, onMaxChange]
  );

  const handleMaxPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalMaxPrice(value);

      if (value === "") {
        onMaxChange(null);
      } else {
        const numValue = Math.max(0, parseInt(value) || 0);
        
        // Ensure max is not less than min
        if (minPrice !== null && numValue < minPrice) {
          onMinChange(numValue);
          setLocalMinPrice(numValue.toString());
        }
        
        onMaxChange(numValue);
      }
    },
    [minPrice, onMinChange, onMaxChange]
  );

  const hasActiveFilters = showMinToggle || showMaxToggle;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink-secondary uppercase tracking-wide">Price Range</h3>
        {hasActiveFilters && (
          <button
            onClick={() => {
              setShowMinToggle(false);
              setShowMaxToggle(false);
              setLocalMinPrice("");
              setLocalMaxPrice("");
              onMinChange(null);
              onMaxChange(null);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-smooth"
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Min Price Toggle */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-2"
      >
        <button
          onClick={handleMinToggle}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface-tertiary transition-smooth"
        >
          <span className="text-sm font-bold text-ink flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMinToggle}
              onChange={() => {}}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
            Minimum Price
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${showMinToggle ? "rotate-180" : ""}`}
          />
        </button>

        {showMinToggle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 pl-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-tertiary">₹</span>
              <input
                type="number"
                min="0"
                value={localMinPrice}
                onChange={handleMinPriceChange}
                placeholder="0"
                className="input-base text-sm"
              />
            </div>
            {minPrice !== null && (
              <p className="text-xs text-ink-secondary">
                Starting from ₹{minPrice.toLocaleString("en-IN")}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Max Price Toggle */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-2"
      >
        <button
          onClick={handleMaxToggle}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-surface-secondary p-3 hover:bg-surface-tertiary transition-smooth"
        >
          <span className="text-sm font-bold text-ink flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMaxToggle}
              onChange={() => {}}
              className="w-4 h-4 rounded accent-primary cursor-pointer"
            />
            Maximum Price
          </span>
          <ChevronDown
            size={16}
            className={`transition-transform ${showMaxToggle ? "rotate-180" : ""}`}
          />
        </button>

        {showMaxToggle && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 pl-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-tertiary">₹</span>
              <input
                type="number"
                min="0"
                value={localMaxPrice}
                onChange={handleMaxPriceChange}
                placeholder="No limit"
                className="input-base text-sm"
              />
            </div>
            {maxPrice !== null && (
              <p className="text-xs text-ink-secondary">
                Up to ₹{maxPrice.toLocaleString("en-IN")}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Price Range Summary */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg bg-primary/10 border border-primary/20 p-3"
        >
          <p className="text-xs font-bold text-primary">
            {minPrice !== null && maxPrice !== null
              ? `₹${minPrice.toLocaleString("en-IN")} - ₹${maxPrice.toLocaleString("en-IN")}`
              : minPrice !== null
              ? `Min: ₹${minPrice.toLocaleString("en-IN")}`
              : `Max: ₹${maxPrice?.toLocaleString("en-IN")}`}
          </p>
        </motion.div>
      )}
    </div>
  );
}
