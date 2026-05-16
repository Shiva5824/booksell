"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, GraduationCap, User, Phone, Loader2, Check } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";
import { uploadImages } from "@/services/api";
import { INDIAN_COLLEGES } from "@/lib/colleges";

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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const filteredColleges = INDIAN_COLLEGES.filter(c => 
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  ).slice(0, 5);

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
            className="relative w-full max-w-xl overflow-hidden rounded-[32px] bg-surface-bg shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/10 p-6">
              <h2 className="text-xl font-black text-ink">Edit Profile</h2>
              <button onClick={onClose} className="rounded-full p-2 text-ink-tertiary hover:bg-surface-secondary hover:text-ink transition-all">
                <X size={20} />
              </button>
            </div>

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
                  
                  {collegeSearch && filteredColleges.length > 0 && (
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
