"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { ref, onValue, off } from "firebase/database";
import { database } from "@/lib/firebase";

interface ToastData {
  id: string;
  senderName: string;
  messageText: string;
  productTitle: string;
  productId: string;
}

export default function ChatNotificationToast() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<ToastData | null>(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const previousChatsRef = useRef<Record<string, any>>({});
  const initialLoadCompleted = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Preload notification sound on client-side mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
      audioRef.current.volume = 0.45;
      audioRef.current.preload = "auto";
    }
  }, []);

  const synthesizeBellSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      
      // Tone 1: Primary fundamental bell body (A5 note)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      
      // Tone 2: Pure high chime overtone (E6 note)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1318.51, now);
      
      gain2.gain.setValueAtTime(0.12, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      
      osc1.start(now);
      osc2.start(now);
      
      osc1.stop(now + 1.0);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn("Web Audio API synthesis failed:", e);
    }
  };

  const playNotificationSound = () => {
    // 1. Attempt to play preloaded high-fidelity WAV sound
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          console.log("Preloaded WAV notification sound played successfully.");
        })
        .catch((err) => {
          console.warn("WAV sound blocked or failed, falling back to Web Audio API synthesizer...", err);
          // 2. Fall back to pure programmatic Web Audio API digital bell chime
          synthesizeBellSound();
        });
    } else {
      synthesizeBellSound();
    }
  };

  // Sync total unread count from Firebase Realtime Database
  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const chatsRef = ref(database, `users/${user.uid}/chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const chats = snapshot.val() || {};
      let sum = 0;
      Object.keys(chats).forEach((id) => {
        sum += chats[id].unread || 0;
      });
      setTotalUnread(sum);

      // Setup initial chats for first load comparison
      if (!initialLoadCompleted.current) {
        previousChatsRef.current = chats;
        initialLoadCompleted.current = true;
        return;
      }

      // Check for incoming unread messages to trigger popup
      Object.keys(chats).forEach((threadId) => {
        const prevChat = previousChatsRef.current[threadId];
        const currentChat = chats[threadId];

        if (currentChat && (!prevChat || currentChat.timestamp > prevChat.timestamp)) {
          if (currentChat.unread > (prevChat?.unread || 0)) {
            // Silenced on the messages page
            if (pathname === "/chat") return;

            setToast({
              id: threadId,
              senderName: currentChat.otherUserName,
              messageText: currentChat.lastMessage,
              productTitle: currentChat.productTitle,
              productId: currentChat.productId,
            });

            // Play dynamic preloaded / synthesized chime sound
            playNotificationSound();

            // Auto-dismiss after 6 seconds
            const timer = setTimeout(() => {
              setToast(null);
            }, 6000);
            return () => clearTimeout(timer);
          }
        }
      });

      previousChatsRef.current = chats;
    });

    return () => {
      off(chatsRef, "value", unsubscribe);
    };
  }, [user, pathname]);

  const handleToastClick = () => {
    if (toast) {
      router.push(`/chat?product=${toast.productId}`);
      setToast(null);
    }
  };

  const handleBellClick = () => {
    router.push("/chat");
  };

  // Silenced completely in messages section
  if (pathname === "/chat" || !user) return null;

  return (
    <>
      {/* Floating Bell Button */}
      <button
        onClick={handleBellClick}
        className="fixed z-50 h-12 w-12 flex items-center justify-center rounded-full border border-border/10 bg-white/95 text-ink-secondary hover:text-orange-500 shadow-soft backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 bottom-[76px] right-4 sm:bottom-5 sm:right-5 dark:bg-slate-900/95"
        aria-label="View Messages"
      >
        <Bell size={20} className={totalUnread > 0 ? "animate-wiggle text-orange-500" : ""} />
        
        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-white dark:border-slate-950 items-center justify-center text-[9px] font-black text-white">
              {totalUnread}
            </span>
          </span>
        )}
      </button>

      {/* Floating Toast Notification — GPU-only translateY+opacity, no spring, no scale */}
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{
              duration: 0.26,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            onClick={handleToastClick}
            style={{ willChange: "transform, opacity" }}
            className="fixed z-[9999] flex w-[280px] max-w-[85vw] cursor-pointer items-start gap-3 rounded-2xl border border-border/10 bg-white/95 p-3.5 shadow-soft backdrop-blur-xl hover:bg-white hover:shadow-glow-primary dark:bg-slate-900/95 dark:hover:bg-slate-900 bottom-[136px] right-4 sm:bottom-20 sm:right-5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-xs shadow-glow-primary">
              {toast.senderName[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping" />
                  New Message
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToast(null);
                  }}
                  className="rounded-lg p-0.5 text-ink-tertiary hover:bg-surface-secondary hover:text-ink"
                >
                  <X size={12} />
                </button>
              </div>
              <h4 className="text-xs font-black text-ink mt-0.5 truncate">{toast.senderName}</h4>
              <p className="text-[10px] text-ink-secondary mt-0.5 truncate font-semibold">Re: {toast.productTitle}</p>
              <p className="text-xs text-ink mt-2 truncate font-semibold bg-surface-secondary/50 p-2 rounded-xl dark:bg-white/5 border border-border/5">
                {toast.messageText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
