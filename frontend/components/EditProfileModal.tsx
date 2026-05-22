"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, GraduationCap, User, Phone, Loader2, Check, MapPin, Edit2, Trash2, Plus } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { uploadImages, addLocation, updateLocation, deleteLocation } from "@/services/api";
import { INDIAN_COLLEGES } from "@/lib/colleges";
import dynamic from "next/dynamic";
import type { Location } from "@/lib/types";

const LocationPickerNew = dynamic(() => import("./LocationPickerNew"), {
  loading: () => (
    <div className="h-80 bg-surface-tertiary rounded-2xl flex items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  ),
  ssr: false,
});

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { dbUser, updateProfile } = useAuth();
  
  const [name, setName] = useState(dbUser?.name || "");
  const [avatar, setAvatar] = useState(dbUser?.avatar || "");
  const [phone, setPhone] = useState(dbUser?.phone || "");
  const [college, setCollege] = useState(dbUser?.college || "");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [locations, setLocations] = useState<Location[]>(dbUser?.locations || []);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "address">("profile");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(dbUser?.name || "");
    setAvatar(dbUser?.avatar || "");
    setPhone(dbUser?.phone || "");
    setCollege(dbUser?.college || "");
    setLocations(dbUser?.locations || []);
  }, [dbUser, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const urls = await uploadImages([file]);
      if (urls && urls.length > 0) {
        setAvatar(urls[0]);
      }
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar,
        phone,
        college: college.trim()
      });
      onClose();
    } catch (err) {
      alert("Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLocation = async (locationData: any) => {
    setIsSavingLocation(true);
    try {
      const result = await addLocation({
        ...locationData,
        isDefault: locations.length === 0 // First location is default
      });
      if (result.data?.locations) {
        setLocations(result.data.locations);
      }
      setShowLocationPicker(false);
    } catch (err) {
      alert("Failed to add location.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleUpdateLocation = async (locationData: any) => {
    if (!editingLocationId) return;
    setIsSavingLocation(true);
    try {
      const result = await updateLocation(editingLocationId, locationData);
      if (result.data?.locations) {
        setLocations(result.data.locations);
      }
      setEditingLocationId(null);
      setShowLocationPicker(false);
    } catch (err) {
      alert("Failed to update location.");
    } finally {
      setIsSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      const result = await deleteLocation(locationId);
      if (result.data?.locations) {
        setLocations(result.data.locations);
      }
    } catch (err) {
      alert("Failed to delete location.");
    }
  };

  const handleSetDefault = async (locationId: string) => {
    try {
      const result = await updateLocation(locationId, { isDefault: true });
      if (result.data?.locations) {
        setLocations(result.data.locations);
      }
    } catch (err) {
      alert("Failed to set default location.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-surface-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/10 p-6">
              <h2 className="text-xl font-black text-ink">Edit Profile</h2>
              <button onClick={onClose} className="rounded-full p-2 text-ink-tertiary hover:bg-surface-secondary hover:text-ink transition-all">
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border/10 bg-surface-secondary/50">
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-wider transition-all ${
                  activeTab === "profile"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-ink-tertiary hover:text-ink"
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab("address")}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-wider transition-all ${
                  activeTab === "address"
                    ? "border-b-2 border-primary text-primary bg-primary/5"
                    : "text-ink-tertiary hover:text-ink"
                }`}
              >
                Address
              </button>
            </div>

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                  <div className="group relative h-32 w-32 overflow-hidden rounded-[40px] border-4 border-surface-tertiary bg-surface-tertiary shadow-lg">
                    {avatar ? (
                      <Image src={avatar} alt="Profile" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-ink-tertiary">
                        <User size={48} />
                      </div>
                    )}
                    
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      {isUploading ? (
                        <Loader2 className="animate-spin text-white" size={24} />
                      ) : (
                        <>
                          <Camera className="text-white mb-1" size={24} />
                          <span className="text-[10px] font-black text-white uppercase">Change</span>
                        </>
                      )}
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-ink-tertiary ml-1">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-border/10 bg-surface-tertiary py-3.5 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-ink-tertiary ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border border-border/10 bg-surface-tertiary py-3.5 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>

                  {/* College */}
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase tracking-widest text-ink-tertiary ml-1">College / University</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
                      <input
                        type="text"
                        value={collegeSearch || college}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value);
                          setCollege(e.target.value);
                        }}
                        required
                        placeholder="Search or enter college..."
                        className="w-full rounded-2xl border border-border/10 bg-surface-tertiary py-3.5 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                    
                    {collegeSearch && (
                      (() => {
                        const filteredColleges = INDIAN_COLLEGES.filter(c => 
                          c.toLowerCase().includes(collegeSearch.toLowerCase())
                        ).slice(0, 5);
                        return filteredColleges.length > 0 ? (
                          <div className="mt-2 rounded-2xl border border-border/10 bg-surface-bg p-2 shadow-lg">
                            {filteredColleges.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setCollege(c);
                                  setCollegeSearch("");
                                }}
                                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-ink-secondary hover:bg-surface-tertiary hover:text-ink transition-all"
                              >
                                <GraduationCap size={14} className="text-primary/60" />
                                {c}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-2xl border border-border bg-surface-bg py-4 text-sm font-black text-ink-secondary hover:bg-surface-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="flex-1 btn-primary py-4 text-sm shadow-glow-primary disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <div className="flex items-center gap-2"><Check size={20} /> Save Changes</div>}
                  </button>
                </div>
              </form>
            )}

            {/* Address Tab */}
            {activeTab === "address" && (
              <div className="p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {/* Saved Locations */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-ink">My Locations</h3>
                    <button
                      onClick={() => setShowLocationPicker(true)}
                      className="flex items-center gap-2 rounded-xl btn-primary px-4 py-2 text-sm font-black"
                    >
                      <Plus size={16} /> Add Location
                    </button>
                  </div>

                  {locations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border/20 p-8 text-center">
                      <MapPin size={32} className="text-ink-tertiary mx-auto mb-3" />
                      <p className="text-sm font-bold text-ink-secondary">No locations added yet</p>
                      <p className="text-xs text-ink-tertiary mt-1">Add your first location to make it easier to post listings</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {locations.map((location) => (
                        <div
                          key={location._id}
                          className={`rounded-2xl border p-4 transition-all ${
                            location.isDefault
                              ? "border-primary/30 bg-primary/5"
                              : "border-border/10 bg-surface-secondary/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-ink">{location.label}</h4>
                                {location.isDefault && (
                                  <span className="text-[10px] font-black bg-primary/20 text-primary px-2 py-1 rounded-full uppercase">Default</span>
                                )}
                              </div>
                              <p className="text-sm text-ink-secondary break-words">{location.address}</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              {!location.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(location._id)}
                                  className="rounded-lg border border-border bg-surface-bg p-2 text-ink-tertiary hover:text-primary hover:border-primary/30 transition-all"
                                  title="Set as default"
                                >
                                  <Check size={16} />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setEditingLocationId(location._id);
                                  setShowLocationPicker(true);
                                }}
                                className="rounded-lg border border-border bg-surface-bg p-2 text-ink-tertiary hover:text-primary hover:border-primary/30 transition-all"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteLocation(location._id)}
                                className="rounded-lg border border-border bg-surface-bg p-2 text-ink-tertiary hover:text-red-500 hover:border-red-500/30 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Picker Modal */}
                <AnimatePresence>
                  {showLocationPicker && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                          setShowLocationPicker(false);
                          setEditingLocationId(null);
                        }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                      />
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl overflow-hidden rounded-[32px] bg-surface-bg shadow-2xl"
                      >
                        <div className="flex items-center justify-between border-b border-border/10 p-6">
                          <h3 className="text-lg font-black text-ink">
                            {editingLocationId ? "Edit Location" : "Add New Location"}
                          </h3>
                          <button
                            onClick={() => {
                              setShowLocationPicker(false);
                              setEditingLocationId(null);
                            }}
                            className="rounded-full p-2 text-ink-tertiary hover:bg-surface-secondary hover:text-ink transition-all"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                          <LocationPickerNew
                            onSelectLocation={(loc) => {
                              if (editingLocationId) {
                                handleUpdateLocation(loc);
                              } else {
                                handleAddLocation(loc);
                              }
                            }}
                            defaultLocation={
                              editingLocationId
                                ? locations.find(l => l._id === editingLocationId)
                                : undefined
                            }
                            allowMultiple={true}
                          />
                        </div>
                      </motion.div>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
