"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { uploadImages } from "@/services/api";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { name: string; avatar: string }) => void;
  currentName: string;
  currentAvatar?: string;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSuccess,
  currentName,
  currentAvatar,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(currentAvatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      setAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Validate name
      if (!name.trim()) {
        setError("Name cannot be empty");
        setLoading(false);
        return;
      }

      let avatarUrl = currentAvatar || "";

      // Upload avatar if changed
      if (avatar) {
        const imageUrls = await uploadImages([avatar]);
        avatarUrl = imageUrls[0] || avatarUrl;
      }

      // Update profile
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/profile`,
        { name, avatar: avatarUrl },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      onSuccess({ name, avatar: avatarUrl });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-2xl border border-border bg-surface-bg shadow-soft overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border p-6">
                <h2 className="text-2xl font-black text-ink">Edit Profile</h2>
                <button
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-secondary text-ink-secondary transition-smooth hover:bg-surface-tertiary hover:text-ink"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {/* Avatar Upload */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-ink-secondary">Profile Picture</label>
                  <div className="space-y-3">
                    {/* Preview */}
                    <div className="flex justify-center">
                      {previewUrl ? (
                        <div className="relative h-24 w-24">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="rounded-xl object-cover border-2 border-primary"
                          />
                        </div>
                      ) : (
                        <div className="h-24 w-24 rounded-xl bg-surface-secondary border-2 border-border flex items-center justify-center text-ink-tertiary">
                          <Upload size={32} />
                        </div>
                      )}
                    </div>

                    {/* Upload Input */}
                    <label className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 transition-smooth hover:border-primary/60 hover:bg-primary/10">
                      <span className="text-center">
                        <Upload size={20} className="mx-auto text-primary mb-1" />
                        <p className="text-xs font-bold text-ink-secondary">Click to upload image</p>
                        <p className="text-[10px] text-ink-tertiary">PNG, JPG or WebP (max 5MB)</p>
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-ink-secondary">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="input-base"
                    disabled={loading}
                  />
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400 font-semibold"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="rounded-xl border border-border bg-surface-secondary px-4 py-3 font-bold text-ink-secondary transition-smooth hover:bg-surface-tertiary disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader size={18} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
