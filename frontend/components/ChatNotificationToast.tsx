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
            // Check if the user is already actively viewing this specific chat thread
            const activeThreadId = typeof window !== "undefined" ? sessionStorage.getItem("activeChatThreadId") : null;
            const isViewingThisThread = pathname === "/chat" && activeThreadId === threadId;

            if (!isViewingThisThread) {
              // Trigger the notification popup!
              setToast({
                id: threadId,
                senderName: currentChat.otherUserName,
                messageText: currentChat.lastMessage,
                productTitle: currentChat.productTitle,
                productId: currentChat.productId,
              });

              // Auto-dismiss after 6 seconds
              const timer = setTimeout(() => {
                setToast(null);
              }, 6000);
              return () => clearTimeout(timer);
            }
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
        <motion.div
          initial={{ x: "120%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "120%", opacity: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 160, 
            damping: 22,
            mass: 0.9
          }}
          onClick={handleToastClick}
          className="fixed bottom-5 right-5 z-[9999] flex w-[320px] cursor-pointer items-start gap-3.5 rounded-2xl border border-border/10 bg-white/95 p-4 shadow-soft backdrop-blur-xl transition-all hover:bg-white hover:shadow-glow-primary dark:bg-slate-900/95 dark:hover:bg-slate-900"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-sm shadow-glow-primary">
            {toast.senderName[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1">
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
                <X size={14} />
              </button>
            </div>
            <h4 className="text-sm font-black text-ink mt-0.5 truncate">{toast.senderName}</h4>
            <p className="text-[11px] text-ink-secondary mt-0.5 truncate font-semibold">Re: {toast.productTitle}</p>
            <p className="text-xs text-ink mt-2 truncate font-semibold bg-surface-secondary/50 p-2 rounded-xl dark:bg-white/5 border border-border/5">
              {toast.messageText}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
