"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, ChevronDown, Trash2, Edit2, Plus } from "lucide-react";
import dynamic from "next/dynamic";

const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  loading: () => <div className="h-80 bg-surface-tertiary rounded-2xl flex items-center justify-center"><Loader2 className="animate-spin" /></div>,
  ssr: false,
});

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

interface SavedLocation extends LocationData {
  _id: string;
  label: string;
  isDefault?: boolean;
}

interface LocationPickerProps {
  onSelectLocation: (location: LocationData) => void;
  savedLocations?: SavedLocation[];
  onAddLocation?: (location: LocationData & { label: string }) => Promise<void>;
  onUpdateLocation?: (locationId: string, location: LocationData & { label: string }) => Promise<void>;
  onDeleteLocation?: (locationId: string) => Promise<void>;
  defaultLocation?: LocationData;
  allowMultiple?: boolean;
}

export default function LocationPicker({
  onSelectLocation,
  savedLocations = [],
  onAddLocation,
  onUpdateLocation,
  onDeleteLocation,
  defaultLocation,
  allowMultiple = false,
}: LocationPickerProps) {
  const [step, setStep] = useState<"choose" | "auto" | "manual" | "map" | "saved">("choose");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(defaultLocation || null);
  const [currentMapLocation, setCurrentMapLocation] = useState<LocationData | null>(defaultLocation || null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState("My Location");
  const [isSaving, setIsSaving] = useState(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch address suggestions from Nominatim
  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
      setSuggestions([]);
    }
  }, []);

  const handleAddressInput = (value: string) => {
    setAddressInput(value);
    setShowSuggestions(true);

    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 500);
  };

  const selectSuggestion = (suggestion: any) => {
    const location: LocationData = {
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };
    setSelectedLocation(location);
    setCurrentMapLocation(location);
    setAddressInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setStep("map");
  };

  const detectLocation = async () => {
    setIsLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();

          const location: LocationData = {
            address: data.address?.city || data.address?.town || data.display_name || `${latitude}, ${longitude}`,
            latitude,
            longitude,
          };

          setSelectedLocation(location);
          setCurrentMapLocation(location);
          setStep("map");
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          const location: LocationData = {
            address: `${latitude}, ${longitude}`,
            latitude,
            longitude,
          };
          setSelectedLocation(location);
          setCurrentMapLocation(location);
          setStep("map");
        }
        setIsLoading(false);
      },
      (err) => {
        setError(`Could not detect location: ${err.message}`);
        setIsLoading(false);
      }
    );
  };

  const handleMapConfirm = async () => {
    if (!currentMapLocation) return;

    setSelectedLocation(currentMapLocation);

    if (addingNew && onAddLocation) {
      setIsSaving(true);
      try {
        await onAddLocation({
          ...currentMapLocation,
          label: newLocationLabel,
        });
        setAddingNew(false);
        setNewLocationLabel("My Location");
      } catch (err) {
        setError("Failed to save location. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (editingLocationId && onUpdateLocation) {
      setIsSaving(true);
      try {
        await onUpdateLocation(editingLocationId, {
          ...currentMapLocation,
          label: newLocationLabel,
        });
        setEditingLocationId(null);
        setNewLocationLabel("My Location");
      } catch (err) {
        setError("Failed to update location. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }

    onSelectLocation(currentMapLocation);
    setStep("choose");
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!onDeleteLocation) return;

    setIsSaving(true);
    try {
      await onDeleteLocation(locationId);
    } catch (err) {
      setError("Failed to delete location.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLocation = (location: SavedLocation) => {
    setSelectedLocation(location);
    setCurrentMapLocation(location);
    setNewLocationLabel(location.label);
    setEditingLocationId(location._id);
    setAddingNew(false);
    setStep("map");
  };

  const handleAddNewLocation = () => {
    setSelectedLocation(null);
    setCurrentMapLocation(null);
    setNewLocationLabel("My Location");
    setEditingLocationId(null);
    setAddingNew(true);
    setStep("auto");
  };

  return (
    <div className="space-y-4">
      {step === "choose" && (
        <div className="space-y-3">
          {selectedLocation && (
            <div className="rounded-2xl border border-border/10 bg-surface-tertiary p-4">
              <p className="text-xs font-bold text-ink-tertiary uppercase tracking-wide mb-2">Current Location</p>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink truncate">{selectedLocation.address}</p>
                  <p className="text-xs text-ink-tertiary mt-1">
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </p>
                </div>
                {!allowMultiple && (
                  <button
                    onClick={() => {
                      setSelectedLocation(defaultLocation || null);
                      setCurrentMapLocation(defaultLocation || null);
                      setStep("auto");
                    }}
                    className="p-2 hover:bg-surface-bg rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-primary" />
                  </button>
                )}
              </div>
            </div>
          )}

          {savedLocations.length > 0 && (
            <button
              onClick={() => setStep("saved")}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-primary" />
                <div className="text-left">
                  <p className="font-bold text-ink">Select from Saved Locations</p>
                  <p className="text-xs text-ink-tertiary">{savedLocations.length} location{savedLocations.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <ChevronDown size={18} className="text-ink-tertiary" />
            </button>
          )}

          <button
            onClick={() => setStep("auto")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:bg-surface-glass transition-colors"
          >
            <MapPin size={18} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-bold text-ink">Auto-detect My Location</p>
              <p className="text-xs text-ink-tertiary">Using browser geolocation</p>
            </div>
          </button>

          <button
            onClick={() => setStep("manual")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:bg-surface-glass transition-colors"
          >
            <MapPin size={18} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-bold text-ink">Enter Address Manually</p>
              <p className="text-xs text-ink-tertiary">Search and pin on map</p>
            </div>
          </button>

          {allowMultiple && (
            <button
              onClick={handleAddNewLocation}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Plus size={18} className="text-primary" />
              <p className="font-bold text-ink">Add Another Location</p>
            </button>
          )}
        </div>
      )}

      {step === "auto" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Auto-detect your location</p>
            <button
              onClick={detectLocation}
              disabled={isLoading}
              className="w-full p-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-glow-primary transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Detect My Location
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {step === "manual" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Search for address</p>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={addressInput}
                onChange={(e) => handleAddressInput(e.target.value)}
                placeholder="Enter city, street, or landmark..."
                className="w-full p-4 border border-border/10 rounded-2xl bg-surface-tertiary focus:border-primary/50 outline-none transition-all"
              />
              {suggestions.length > 0 && showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 border border-border/10 rounded-2xl bg-surface-bg shadow-lg z-10 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left p-3 hover:bg-surface-tertiary border-b border-border/5 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm font-semibold text-ink truncate">{suggestion.display_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold text-ink">
              {editingLocationId ? "Edit Location" : addingNew ? "Add New Location" : "Adjust Location on Map"}
            </p>
            {(editingLocationId || addingNew) && (
              <input
                type="text"
                value={newLocationLabel}
                onChange={(e) => setNewLocationLabel(e.target.value)}
                placeholder="Location label"
                className="w-full p-3 border border-border/10 rounded-xl bg-surface-tertiary focus:border-primary/50 outline-none transition-all text-sm"
              />
            )}
          </div>

          {currentMapLocation && (
            <InteractiveMap
              initialLocation={currentMapLocation}
              onLocationChange={setCurrentMapLocation}
            />
          )}

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("choose");
                if (editingLocationId) setEditingLocationId(null);
                if (addingNew) setAddingNew(false);
              }}
              className="flex-1 p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMapConfirm}
              disabled={isSaving || !currentMapLocation}
              className="flex-1 p-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:shadow-glow-primary transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm Location"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-ink mb-4">Your Saved Locations</p>
          {savedLocations.map((location) => (
            <div
              key={location._id}
              className="p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink">{location.label}</p>
                  <p className="text-xs text-ink-tertiary mt-1 truncate">{location.address}</p>
                  <p className="text-xs text-ink-tertiary">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
                {location.isDefault && (
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg whitespace-nowrap">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectLocation(location);
                    setStep("choose");
                  }}
                  className="flex-1 p-2 text-sm font-bold bg-primary text-white rounded-lg hover:shadow-glow-primary transition-all"
                >
                  Select
                </button>
                {onUpdateLocation && (
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="p-2 text-primary hover:bg-surface-glass rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {onDeleteLocation && (
                  <button
                    onClick={() => handleDeleteLocation(location._id)}
                    disabled={isSaving}
                    className="p-2 text-red-500 hover:bg-surface-glass rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}

  const handleAddressInput = (value: string) => {
    setAddressInput(value);
    fetchSuggestions(value);
    setShowSuggestions(true);
  };

  const selectSuggestion = (suggestion: any) => {
    const location: LocationData = {
      address: suggestion.display_name,
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };
    setSelectedLocation(location);
    setCurrentMapLocation(location);
    setAddressInput("");
    setSuggestions([]);
    setShowSuggestions(false);
    setStep("map");
  };

  const detectLocation = async () => {
    setIsLoading(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const location: LocationData = {
            address: data.address?.city || data.address?.town || data.display_name || `${latitude}, ${longitude}`,
            latitude,
            longitude,
          };
          
          setAutoDetectedLocation(location);
          setSelectedLocation(location);
          setCurrentMapLocation(location);
          setStep("map");
        } catch (err) {
          console.error("Error reverse geocoding:", err);
          const location: LocationData = {
            address: `${latitude}, ${longitude}`,
            latitude,
            longitude,
          };
          setAutoDetectedLocation(location);
          setSelectedLocation(location);
          setCurrentMapLocation(location);
          setStep("map");
        }
      },
      (err) => {
        setError(`Could not detect location: ${err.message}`);
        setIsLoading(false);
      }
    );
    
    setIsLoading(false);
  };

  const handleMapConfirm = async () => {
    if (!currentMapLocation) return;
    
    setSelectedLocation(currentMapLocation);

    if (addingNew && onAddLocation) {
      setIsSaving(true);
      try {
        await onAddLocation({
          ...currentMapLocation,
          label: newLocationLabel,
        });
        setAddingNew(false);
        setNewLocationLabel("My Location");
      } catch (err) {
        setError("Failed to save location. Please try again.");
      } finally {
        setIsSaving(false);
      }
    } else if (editingLocationId && onUpdateLocation) {
      setIsSaving(true);
      try {
        await onUpdateLocation(editingLocationId, {
          ...currentMapLocation,
          label: newLocationLabel,
        });
        setEditingLocationId(null);
        setNewLocationLabel("My Location");
      } catch (err) {
        setError("Failed to update location. Please try again.");
      } finally {
        setIsSaving(false);
      }
    }

    onSelectLocation(currentMapLocation);
    setStep("choose");
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!onDeleteLocation) return;
    
    setIsSaving(true);
    try {
      await onDeleteLocation(locationId);
    } catch (err) {
      setError("Failed to delete location.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditLocation = (location: SavedLocation) => {
    setSelectedLocation(location);
    setCurrentMapLocation(location);
    setNewLocationLabel(location.label);
    setEditingLocationId(location._id);
    setAddingNew(false);
    setStep("map");
  };

  const handleAddNewLocation = () => {
    setSelectedLocation(null);
    setCurrentMapLocation(null);
    setNewLocationLabel("My Location");
    setEditingLocationId(null);
    setAddingNew(true);
    setStep("auto");
  };

  return (
    <div className="space-y-4">
      {step === "choose" && (
        <div className="space-y-3">
          {selectedLocation && (
            <div className="rounded-2xl border border-border/10 bg-surface-tertiary p-4">
              <p className="text-xs font-bold text-ink-tertiary uppercase tracking-wide mb-2">Current Location</p>
              <div className="flex items-start justify-between gap-3 w-full">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink truncate max-w-full" title={selectedLocation.address}>{selectedLocation.address}</p>
                  <p className="text-xs text-ink-tertiary mt-1">
                    {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </p>
                </div>
                {!allowMultiple && (
                  <button
                    onClick={() => {
                      setSelectedLocation(defaultLocation || null);
                      setCurrentMapLocation(defaultLocation || null);
                      setStep("auto");
                    }}
                    className="p-2 hover:bg-surface-bg rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} className="text-primary" />
                  </button>
                )}
              </div>
            </div>
          )}

          {savedLocations.length > 0 && (
            <button
              onClick={() => setStep("saved")}
              className="w-full flex items-center justify-between p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-primary" />
                <div className="text-left">
                  <p className="font-bold text-ink">Select from Saved Locations</p>
                  <p className="text-xs text-ink-tertiary">{savedLocations.length} location{savedLocations.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <ChevronDown size={18} className="text-ink-tertiary" />
            </button>
          )}

          <button
            onClick={() => setStep("auto")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:bg-surface-glass transition-colors"
          >
            <MapPin size={18} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-bold text-ink">Auto-detect My Location</p>
              <p className="text-xs text-ink-tertiary">Using browser geolocation</p>
            </div>
          </button>

          <button
            onClick={() => setStep("manual")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:bg-surface-glass transition-colors"
          >
            <MapPin size={18} className="text-primary" />
            <div className="text-left flex-1">
              <p className="font-bold text-ink">Enter Address Manually</p>
              <p className="text-xs text-ink-tertiary">Search and pin on map</p>
            </div>
          </button>

          {allowMultiple && (
            <button
              onClick={handleAddNewLocation}
              className="w-full flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
            >
              <Plus size={18} className="text-primary" />
              <p className="font-bold text-ink">Add Another Location</p>
            </button>
          )}
        </div>
      )}

      {step === "auto" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Auto-detect your location</p>
            <button
              onClick={detectLocation}
              disabled={isLoading}
              className="w-full p-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-glow-primary transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Detecting...
                </>
              ) : (
                <>
                  <MapPin size={18} />
                  Detect My Location
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {step === "manual" && (
        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink">Search for address</p>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={addressInput}
                onChange={(e) => handleAddressInput(e.target.value)}
                placeholder="Enter city, street, or landmark..."
                className="w-full p-4 border border-border/10 rounded-2xl bg-surface-tertiary focus:border-primary/50 outline-none transition-all"
              />
              {suggestions.length > 0 && showSuggestions && (
                <div
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-2 border border-border/10 rounded-2xl bg-surface-bg shadow-lg z-10 max-h-64 overflow-y-auto"
                >
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectSuggestion(suggestion)}
                      className="w-full text-left p-3 hover:bg-surface-tertiary border-b border-border/5 last:border-b-0 transition-colors"
                    >
                      <p className="text-sm font-semibold text-ink truncate">{suggestion.display_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}

      {step === "map" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-bold text-ink">
              {editingLocationId ? "Edit Location" : addingNew ? "Add New Location" : "Adjust Location on Map"}
            </p>
            {(editingLocationId || addingNew) && (
              <input
                type="text"
                value={newLocationLabel}
                onChange={(e) => setNewLocationLabel(e.target.value)}
                placeholder="Location label"
                className="w-full p-3 border border-border/10 rounded-xl bg-surface-tertiary focus:border-primary/50 outline-none transition-all text-sm"
              />
            )}
          </div>

          {currentMapLocation && (
            <InteractiveMap
              initialLocation={currentMapLocation}
              onLocationChange={setCurrentMapLocation}
            />
          )}

          {error && (
            <p className="text-sm text-red-500 font-semibold">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setStep("choose");
                if (editingLocationId) setEditingLocationId(null);
                if (addingNew) setAddingNew(false);
              }}
              className="flex-1 p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleMapConfirm}
              disabled={isSaving || !currentMapLocation}
              className="flex-1 p-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 hover:shadow-glow-primary transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Confirm Location"
              )}
            </button>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-ink mb-4">Your Saved Locations</p>
          {savedLocations.map((location) => (
            <div
              key={location._id}
              className="p-4 rounded-2xl border border-border/10 bg-surface-tertiary hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink">{location.label}</p>
                  <p className="text-xs text-ink-tertiary mt-1 truncate">{location.address}</p>
                  <p className="text-xs text-ink-tertiary">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
                {location.isDefault && (
                  <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-1 rounded-lg whitespace-nowrap">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onSelectLocation(location);
                    setStep("choose");
                  }}
                  className="flex-1 p-2 text-sm font-bold bg-primary text-white rounded-lg hover:shadow-glow-primary transition-all"
                >
                  Select
                </button>
                {onUpdateLocation && (
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="p-2 text-primary hover:bg-surface-glass rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                )}
                {onDeleteLocation && (
                  <button
                    onClick={() => handleDeleteLocation(location._id)}
                    disabled={isSaving}
                    className="p-2 text-red-500 hover:bg-surface-glass rounded-lg transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setStep("choose")}
            className="w-full p-3 text-center font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
}
