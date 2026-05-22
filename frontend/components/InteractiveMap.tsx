"use client";

import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface MapLocation {
  latitude: number;
  longitude: number;
  address: string;
}

interface InteractiveMapProps {
  initialLocation: MapLocation;
  onLocationChange: (location: MapLocation) => void;
}

declare global {
  interface Window {
    L: any;
  }
}

export default function InteractiveMap({ initialLocation, onLocationChange }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Dynamically load Leaflet
    const loadMap = async () => {
      try {
        // Load CSS
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
        script.async = true;
        script.onload = () => {
          initializeMap();
        };
        document.head.appendChild(script);
      } catch (err) {
        console.error("Error loading Leaflet:", err);
        setIsLoading(false);
      }
    };

    const initializeMap = () => {
      if (!mapContainer.current || !window.L) return;

      const L = window.L;

      // Initialize map
      map.current = L.map(mapContainer.current).setView(
        [initialLocation.latitude, initialLocation.longitude],
        13
      );

      // Add tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map.current);

      // Add draggable marker
      marker.current = L.marker([initialLocation.latitude, initialLocation.longitude], {
        draggable: true,
      }).addTo(map.current);

      // Handle marker drag
      marker.current.on("dragend", () => {
        const latLng = marker.current.getLatLng();
        onLocationChange({
          latitude: latLng.lat,
          longitude: latLng.lng,
          address: initialLocation.address,
        });
      });

      // Handle map click
      map.current.on("click", (e: any) => {
        const { lat, lng } = e.latlng;
        marker.current.setLatLng([lat, lng]);
        onLocationChange({
          latitude: lat,
          longitude: lng,
          address: initialLocation.address,
        });
      });

      setIsLoading(false);
    };

    loadMap();

    return () => {
      // Cleanup
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialLocation, onLocationChange]);

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-border/10 bg-surface-tertiary">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-tertiary/50 backdrop-blur-sm z-10">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
