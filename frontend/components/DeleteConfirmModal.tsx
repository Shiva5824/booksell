"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  loading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  loading = false,
}: DeleteConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with extreme blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40, rotate: 2 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-sm overflow-hidden rounded-[2.5rem] border border-border/10 bg-surface-bg/80 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
            >
              {/* Background Accent Glow */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-red-500/20 blur-[60px]" />
              <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/10 blur-[60px]" />

              {/* Close Button */}
              {!loading && (
                <button
                  onClick={onClose}
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-secondary/50 text-ink-tertiary transition-all hover:bg-surface-secondary/80 hover:rotate-90 hover:text-ink active:scale-90"
                >
                  <X size={20} />
                </button>
              )}

              {/* Icon with Ring Animation */}
              <div className="relative mx-auto mb-8 flex h-24 w-24 items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-red-500/20" 
                />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-red-500 to-red-600 shadow-glow-red">
                  <AlertTriangle size={40} className="text-white" />
                </div>
              </div>

              {/* Text */}
              <div className="mb-10 text-center">
                <h2 className="mb-3 text-3xl font-black tracking-tight text-ink">Wait!</h2>
                <p className="text-base font-semibold text-ink-secondary leading-relaxed">
                  Are you absolutely sure you want to delete <span className="text-red-400 font-black italic underline decoration-red-400/30 underline-offset-4">&quot;{title}&quot;</span>?
                </p>
                <div className="mt-4 rounded-xl bg-red-500/5 p-3 border border-red-500/10">
                  <p className="text-xs font-bold text-red-400/80 uppercase tracking-widest">This action is permanent</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 py-4.5 text-lg font-black text-white shadow-glow-red transition-all hover:shadow-[0_20px_40px_-12px_rgba(239,68,68,0.5)] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={24} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Yes, Delete Forever"
                  )}
                </motion.button>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="w-full py-4 text-sm font-black text-ink-tertiary transition-all hover:text-ink active:scale-95 disabled:opacity-50"
                >
                  I changed my mind
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
