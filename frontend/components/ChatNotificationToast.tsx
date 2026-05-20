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
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize + unlock audio
  useEffect(() => {
    if (typeof window === "undefined") return;

    audioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav"
    );

    audioRef.current.volume = 0.45;
    audioRef.current.preload = "auto";

    const AudioContextClass =
      window.AudioContext ||
      (window as any).webkitAudioContext;

    if (AudioContextClass) {
      audioCtxRef.current = new AudioContextClass();
    }

    const unlockAudio = async () => {
      try {
        // unlock HTML audio
        if (audioRef.current) {
          await audioRef.current.play();
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }

        // unlock WebAudio
        if (
          audioCtxRef.current &&
          audioCtxRef.current.state === "suspended"
        ) {
          await audioCtxRef.current.resume();
        }

        console.log("Audio unlocked");
      } catch (err) {
        console.log("Audio unlock failed:", err);
      }
    };

    document.addEventListener(
      "click",
      unlockAudio,
      { once: true }
    );

    document.addEventListener(
      "touchstart",
      unlockAudio,
      { once: true }
    );

    return () => {
      document.removeEventListener(
        "click",
        unlockAudio
      );

      document.removeEventListener(
        "touchstart",
        unlockAudio
      );

      audioCtxRef.current?.close();
    };
  }, []);

  const synthesizeBellSound = async () => {
    try {
      const ctx = audioCtxRef.current;

      if (!ctx) return;

      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.value = 880;

      gain1.gain.setValueAtTime(
        0.2,
        now
      );

      gain1.gain.exponentialRampToValueAtTime(
        0.001,
        now + 1
      );

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = "sine";
      osc2.frequency.value = 1318.51;

      gain2.gain.setValueAtTime(
        0.12,
        now
      );

      gain2.gain.exponentialRampToValueAtTime(
        0.001,
        now + 0.5
      );

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 1);
      osc2.stop(now + 0.5);

    } catch (err) {
      console.log(
        "Synth sound failed:",
        err
      );
    }
  };

  const playNotificationSound = async () => {
    try {
      if (!audioRef.current) {
        await synthesizeBellSound();
        return;
      }

      audioRef.current.currentTime = 0;

      await audioRef.current.play();

      console.log(
        "Notification sound played"
      );

    } catch (err) {
      console.warn(
        "Audio blocked/failure:",
        err
      );

      await synthesizeBellSound();
    }
  };

  useEffect(() => {
    if (!user) {
      setTotalUnread(0);
      return;
    }

    const chatsRef = ref(
      database,
      `users/${user.uid}/chats`
    );

    const unsubscribe = onValue(
      chatsRef,
      (snapshot) => {
        const chats = snapshot.val() || {};

        let sum = 0;

        Object.keys(chats).forEach(
          (id) => {
            sum += chats[id].unread || 0;
          }
        );

        setTotalUnread(sum);

        if (
          !initialLoadCompleted.current
        ) {
          previousChatsRef.current =
            chats;

          initialLoadCompleted.current = true;

          return;
        }

        Object.keys(chats).forEach(
          (threadId) => {
            const prev =
              previousChatsRef.current[
                threadId
              ];

            const current =
              chats[threadId];

            if (
              current &&
              (
                !prev ||
                current.timestamp >
                  prev.timestamp
              )
            ) {
              if (
                current.unread >
                (prev?.unread || 0)
              ) {
                if (
                  pathname === "/chat"
                )
                  return;

                setToast({
                  id: threadId,
                  senderName:
                    current.otherUserName,
                  messageText:
                    current.lastMessage,
                  productTitle:
                    current.productTitle,
                  productId:
                    current.productId,
                });

                playNotificationSound();

                setTimeout(() => {
                  setToast(null);
                }, 6000);
              }
            }
          }
        );

        previousChatsRef.current =
          chats;
      }
    );

    return () => {
      off(
        chatsRef,
        "value",
        unsubscribe
      );
    };
  }, [user, pathname]);

  const handleToastClick = () => {
    if (!toast) return;

    router.push(
      `/chat?product=${toast.productId}`
    );

    setToast(null);
  };

  const handleBellClick = () => {
    router.push("/chat");
  };

  if (
    pathname === "/chat" ||
    !user
  )
    return null;

  return (
    <>
      <button
        onClick={handleBellClick}
        className="fixed z-50 h-12 w-12 flex items-center justify-center rounded-full border border-border/10 bg-white/95 text-ink-secondary hover:text-orange-500 shadow-soft backdrop-blur-xl transition-all duration-300 hover:scale-110 active:scale-95 bottom-[76px] right-4 sm:bottom-5 sm:right-5 dark:bg-slate-900/95"
      >
        <Bell
          size={20}
          className={
            totalUnread > 0
              ? "animate-wiggle text-orange-500"
              : ""
          }
        />

        {totalUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>

            <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border-2 border-white dark:border-slate-950 items-center justify-center text-[9px] font-black text-white">
              {totalUnread}
            </span>
          </span>
        )}
      </button>

      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{
              y: 16,
              opacity: 0
            }}
            animate={{
              y: 0,
              opacity: 1
            }}
            exit={{
              y: 16,
              opacity: 0
            }}
            transition={{
              duration: 0.26
            }}
            onClick={handleToastClick}
            className="fixed z-[9999] flex w-[280px] max-w-[85vw] cursor-pointer items-start gap-3 rounded-2xl border border-border/10 bg-white/95 p-3.5 shadow-soft backdrop-blur-xl bottom-[136px] right-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-xs">
              {toast.senderName[0]?.toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-orange-500">
                  New Message
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setToast(null);
                  }}
                >
                  <X size={12}/>
                </button>
              </div>

              <h4 className="text-xs font-black truncate">
                {toast.senderName}
              </h4>

              <p className="text-[10px] truncate">
                Re: {toast.productTitle}
              </p>

              <p className="text-xs mt-2 truncate">
                {toast.messageText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}