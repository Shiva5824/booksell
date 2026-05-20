"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
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
  const previousChatsRef = useRef<Record<string, any>>({});
  const initialLoadCompleted = useRef(false);

  useEffect(() => {
    if (!user) {
      setToast(null);
      return;
    }

    const chatsRef = ref(database, `users/${user.uid}/chats`);
    
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const chats = snapshot.val() || {};
      
      // If this is the initial load, just populate the previous chats ref and skip showing toasts
      if (!initialLoadCompleted.current) {
        previousChatsRef.current = chats;
        initialLoadCompleted.current = true;
        return;
      }

      // Look for updates/new messages
      Object.keys(chats).forEach((threadId) => {
        const prevChat = previousChatsRef.current[threadId];
        const currentChat = chats[threadId];

        // If the chat timestamp changed (meaning a new message was received)
        if (currentChat && (!prevChat || currentChat.timestamp > prevChat.timestamp)) {
          // If the unread count increased, it is an incoming unread message
          if (currentChat.unread > (prevChat?.unread || 0)) {
            // Pointless to show notification inside the messages section!
            if (pathname === "/chat") {
              return;
            }

            // Trigger the notification popup!
            setToast({
              id: threadId,
              senderName: currentChat.otherUserName,
              messageText: currentChat.lastMessage,
              productTitle: currentChat.productTitle,
              productId: currentChat.productId,
            });

            // Play high-quality crisp instant bell chime sound
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
              audio.volume = 0.45;
              audio.play().catch(() => {});
            } catch (err) {}

            // Auto-dismiss after 5 seconds
            const timer = setTimeout(() => {
              setToast(null);
            }, 5000);
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

  return (
    <AnimatePresence>
      {toast && (
        <div className="fixed top-4 left-0 right-0 z-[9999] pointer-events-none flex justify-center sm:justify-end sm:right-5 sm:left-auto">
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 180, 
              damping: 20,
              mass: 0.8
            }}
            onClick={handleToastClick}
            className="pointer-events-auto flex w-[280px] max-w-[90%] cursor-pointer items-start gap-3 rounded-2xl border border-border/10 bg-white/95 p-3.5 shadow-soft backdrop-blur-xl transition-all hover:bg-white hover:shadow-glow-primary dark:bg-slate-900/95 dark:hover:bg-slate-900"
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
                  className="rounded-lg p-0.5 text-ink-tertiary hover:bg-surface-secondary hover:text-ink transition-smooth"
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
        </div>
      )}
    </AnimatePresence>
  );
}
