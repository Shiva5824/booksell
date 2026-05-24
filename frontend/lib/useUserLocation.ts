"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export type LocationSource = "none" | "saved" | "gps";

export interface UserLocation {
  latitude: number;
  longitude: number;
  label: string;
}

interface UseUserLocationResult {
  location: UserLocation | null;
  source: LocationSource;
  isLocating: boolean;
  error: string | null;
  /** Trigger a fresh GPS read. Resolves to the new location or null. */
  detectGPS: () => Promise<UserLocation | null>;
  /** Reset to saved (or none if no saved location). */
  useSaved: () => void;
  /** Clear current location and source. */
  clear: () => void;
}

/**
 * useUserLocation — single source of truth for the user's current
 * lat/lng for any "nearest first" feature.
 *
 * Strategy:
 *   1. If the user has a saved default address on their profile, use that
 *      automatically (zero-friction, no permission prompt).
 *   2. Allow the caller to upgrade to live GPS via detectGPS().
 *
 * Mirrors the pattern already used in ProductDetailClient so behavior is
 * consistent between distance-on-detail and distance-sort-on-listing.
 */
export function useUserLocation(): UseUserLocationResult {
  const { dbUser } = useAuth();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [source, setSource] = useState<LocationSource>("none");
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefer the user's saved default address as a no-prompt baseline.
  useEffect(() => {
    if (location || source === "gps") return;
    if (dbUser?.locations && dbUser.locations.length > 0) {
      const def =
        dbUser.locations.find((l: any) => l.isDefault) || dbUser.locations[0];
      if (def && typeof def.latitude === "number" && typeof def.longitude === "number") {
        setLocation({
          latitude: def.latitude,
          longitude: def.longitude,
          label: def.label || "Saved address",
        });
        setSource("saved");
      }
    }
  }, [dbUser, location, source]);

  const detectGPS = useCallback((): Promise<UserLocation | null> => {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        setError("Geolocation isn't supported on this device.");
        resolve(null);
        return;
      }
      setError(null);
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const fresh: UserLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            label: "Current location",
          };
          setLocation(fresh);
          setSource("gps");
          setIsLocating(false);
          resolve(fresh);
        },
        (err) => {
          setIsLocating(false);
          setError(err?.message || "Couldn't read your location.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
      );
    });
  }, []);

  const useSaved = useCallback(() => {
    if (dbUser?.locations && dbUser.locations.length > 0) {
      const def =
        dbUser.locations.find((l: any) => l.isDefault) || dbUser.locations[0];
      if (def) {
        setLocation({
          latitude: def.latitude,
          longitude: def.longitude,
          label: def.label || "Saved address",
        });
        setSource("saved");
        return;
      }
    }
    setLocation(null);
    setSource("none");
  }, [dbUser]);

  const clear = useCallback(() => {
    setLocation(null);
    setSource("none");
    setError(null);
  }, []);

  return { location, source, isLocating, error, detectGPS, useSaved, clear };
}

/** Haversine distance in kilometers between two lat/lng points. */
export function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  if (a.latitude === b.latitude && a.longitude === b.longitude) return 0;
  const R = 6371; // Earth radius (km)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/** Format a km distance into a friendly label. */
export function formatDistance(km: number): string {
  if (km < 0.1) return "<100 m";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}
