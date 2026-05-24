"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Upload, Trash2, ChevronUp, ChevronDown, AlertCircle, ImageIcon, Megaphone } from "lucide-react";
import {
  getCarouselMedia,
  createCarouselMedia,
  deleteCarouselMedia,
  updateCarouselMedia,
  reorderCarouselMedia,
  type CarouselSection,
} from "@/services/site";
import { uploadImages } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";

interface Media {
  _id: string;
  imageUrl: string;
  title: string;
  description: string;
  order: number;
  section?: CarouselSection;
}

const SECTION_TABS: Array<{
  value: CarouselSection;
  label: string;
  description: string;
  icon: typeof ImageIcon;
}> = [
  {
    value: "hero",
    label: "Hero Carousel",
    description: "Top-of-homepage main carousel (left of the hero)",
    icon: ImageIcon,
  },
  {
    value: "cta",
    label: "CTA Banner",
    description: '"Save More on College Essentials" image strip (above the footer)',
    icon: Megaphone,
  },
];

export default function AdminMediaComponent() {
  const [section, setSection] = useState<CarouselSection>("hero");
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [message, setMessage] = useState("");

  const maxImages = 10;
  const canUpload = media.length < maxImages;

  const loadMedia = useCallback(async (sec: CarouselSection) => {
    setLoading(true);
    try {
      const data = await getCarouselMedia(sec);
      setMedia(data || []);
    } catch (err) {
      console.error("Failed to load media:", err);
      setMessage("Failed to load media");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedia(section);
  }, [section, loadMedia]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));

      // Avoid creating more than the cap when multi-uploading.
      const slotsLeft = maxImages - media.length;
      const usable = urls.slice(0, slotsLeft);

      const created: Media[] = [];
      for (const url of usable) {
        const newMedia = {
          imageUrl: url,
          title: "",
          description: "",
          order: media.length + created.length + 1,
          section,
        };
        const c = await createCarouselMedia(newMedia);
        created.push(c);
      }

      setMedia([...media, ...created]);
      setMessage(`Uploaded ${created.length} image${created.length === 1 ? "" : "s"}`);
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Upload failed:", error);
      setMessage("Upload failed. Please try again.");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    try {
      await deleteCarouselMedia(id);
      setMedia(media.filter((m) => m._id !== id));
      setMessage("Image deleted");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Delete failed:", error);
      setMessage("Delete failed");
    }
  }

  async function handleSaveEdit(id: string) {
    try {
      const updated = await updateCarouselMedia(id, editForm);
      setMedia(media.map((m) => (m._id === id ? updated : m)));
      setEditingId(null);
      setMessage("Image updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Update failed:", error);
      setMessage("Update failed");
    }
  }

  async function moveImage(id: string, direction: "up" | "down") {
    const index = media.findIndex((m) => m._id === id);
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === media.length - 1) return;

    const newMedia = [...media];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newMedia[index], newMedia[newIndex]] = [newMedia[newIndex], newMedia[index]];
    const updates = newMedia.map((m, idx) => ({ id: m._id, order: idx + 1 }));

    try {
      await reorderCarouselMedia(updates, section);
      setMedia(newMedia);
    } catch (error) {
      console.error("Reorder failed:", error);
      setMessage("Reorder failed");
    }
  }

  const activeTab = SECTION_TABS.find((t) => t.value === section)!;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Carousel Media</h1>
        <p className="mt-2 font-medium text-ink-secondary text-sm">
          Manage carousel images shown across the homepage. Each section caps at {maxImages} images.
        </p>
      </div>

      {/* Section selector — picks which carousel zone to manage. */}
      <div className="flex flex-wrap gap-2 rounded-2xl bg-surface-secondary p-1.5 sm:w-fit dark:bg-white/5">
        {SECTION_TABS.map((t) => {
          const Icon = t.icon;
          const isActive = t.value === section;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => {
                if (t.value === section) return;
                setSection(t.value);
                setEditingId(null);
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? "bg-white text-orange-500 shadow-sm dark:bg-slate-900 dark:text-orange-400"
                  : "text-ink-secondary hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl bg-orange-50/60 border border-orange-100 px-4 py-3 text-xs font-medium text-orange-800 dark:bg-orange-500/5 dark:border-orange-500/20 dark:text-orange-300">
        <span className="font-black">{activeTab.label}:</span> {activeTab.description}
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-200"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-surface-tertiary animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {canUpload ? (
            <div className="rounded-2xl border-2 border-dashed border-border/30 bg-white/50 p-8 text-center dark:bg-white/5">
              <label className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-xl bg-orange-50 p-3 dark:bg-orange-500/10">
                    <Upload size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="font-bold text-ink">
                      {uploading ? "Uploading..." : `Upload Image ${media.length + 1}/${maxImages}`}
                    </p>
                    <p className="text-sm text-ink-secondary">
                      {section === "hero"
                        ? "Drag and drop or click to select (610px+ height recommended)"
                        : "Drag and drop or click to select (1400×400px+ recommended)"}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                  multiple
                />
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 flex items-start gap-3 dark:bg-orange-500/10 dark:border-orange-500/30">
              <AlertCircle size={20} className="text-orange-600 shrink-0 mt-0.5 dark:text-orange-400" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-bold">Maximum images reached for this section</p>
                <p>Delete an image above to upload more.</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {media.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center dark:bg-white/5">
                <p className="text-ink-secondary font-medium">
                  No images in this section yet — upload one above.
                </p>
              </div>
            ) : (
              media.map((item, idx) => (
                <motion.div
                  key={item._id}
                  layout
                  className="rounded-2xl border border-border/10 bg-white p-4 dark:bg-white/5"
                >
                  <div className="flex gap-4">
                    <div className="shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.title || "Carousel image"}
                        className="h-32 w-32 object-cover rounded-xl border border-border/10"
                      />
                      <p className="mt-2 text-xs text-ink-secondary text-center font-medium">
                        {idx + 1}/{media.length}
                      </p>
                    </div>

                    <div className="flex-1 min-w-0">
                      {editingId === item._id ? (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Title"
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border/10 bg-white dark:bg-white/5 focus:outline-none focus:border-orange-300"
                          />
                          <textarea
                            placeholder="Description"
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-border/10 bg-white dark:bg-white/5 focus:outline-none focus:border-orange-300 resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(item._id)}
                              className="btn-primary px-4 py-2 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="btn-secondary px-4 py-2 text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="font-bold text-ink truncate">{item.title || "(Untitled)"}</h3>
                          <p className="mt-1 text-sm text-ink-secondary line-clamp-2">
                            {item.description || "(No description)"}
                          </p>
                          <button
                            onClick={() => {
                              setEditingId(item._id);
                              setEditForm({ title: item.title, description: item.description });
                            }}
                            className="mt-3 text-sm font-bold text-orange-500 hover:text-orange-600"
                          >
                            Edit Title & Description
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex flex-col gap-2">
                      <button
                        onClick={() => moveImage(item._id, "up")}
                        disabled={idx === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/10 bg-white hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:hover:bg-orange-500/10 transition-colors"
                        aria-label="Move up"
                      >
                        <ChevronUp size={18} className="text-ink-secondary" />
                      </button>
                      <button
                        onClick={() => moveImage(item._id, "down")}
                        disabled={idx === media.length - 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/10 bg-white hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white/5 dark:hover:bg-orange-500/10 transition-colors"
                        aria-label="Move down"
                      >
                        <ChevronDown size={18} className="text-ink-secondary" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 dark:bg-white/5 dark:border-red-500/30 dark:hover:bg-red-500/10 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-200">
        <p className="font-bold mb-2">💡 Tips</p>
        <ul className="space-y-1 list-disc list-inside">
          {section === "hero" ? (
            <>
              <li>Hero images should be 610px+ tall for crisp rendering</li>
              <li>Auto-slides every 2 seconds (pauses on hover)</li>
              <li>Use for announcements, promotions, or featured content</li>
            </>
          ) : (
            <>
              <li>CTA images sit beside "Save More on College Essentials" copy</li>
              <li>Wide 16:9 or 4:3 photos work best (≈1400×400px)</li>
              <li>Hidden on small phones (mobile users see only the CTA copy)</li>
            </>
          )}
          <li>Title and description appear as a small overlay caption when set</li>
        </ul>
      </div>
    </div>
  );
}
