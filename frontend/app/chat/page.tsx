"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCheck, Image as ImageIcon, MessageCircle,
  MoreVertical, Paperclip, Phone, Search, Send, ShieldCheck,
  CornerUpLeft, X,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ref, push, onValue, set, off, serverTimestamp, query, orderByChild, update, get, onDisconnect } from "firebase/database";
import { database } from "@/lib/firebase";
import { getProductById, getUserProfile, uploadImages } from "@/services/api";
import type { Product } from "@/lib/types";

interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  status?: string;
  replyToId?: string;
  replyToSender?: string;
  replyToText?: string;
}

interface Thread {
  id: string;
  productId: string;
  productTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  timestamp: number;
  unread: number;
}

const WhatsAppSingleCheck = ({ className, size = 15 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 16 15" width={size} height={size - 1} fill="none" className={`shrink-0 ${className}`}>
    <path d="M1.5 7.5L5.5 11.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const WhatsAppDoubleCheck = ({ className, size = 16 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 16 15" width={size} height={size - 1} fill="none" className={`shrink-0 ${className}`}>
    <path d="M1.5 7.5L5.5 11.5L10.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.5 7.5L9.5 11.5L14.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const formatLastSeen = (timestamp?: number) => {
  if (!timestamp) return "offline";
  const date = new Date(timestamp);
  const now = new Date();
  
  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  
  // Check if it was today
  if (date.toDateString() === now.toDateString()) {
    return `last seen today at ${timeStr}`;
  }
  
  // Check if it was yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return `last seen yesterday at ${timeStr}`;
  }
  
  // Otherwise format with date
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `last seen on ${dateStr} at ${timeStr}`;
};

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background text-ink">Loading messages...</main>}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [text, setText] = useState("");
  const [initiatingProduct, setInitiatingProduct] = useState<Product | null>(null);
  const [profiles, setProfiles] = useState<Record<string, {avatar?: string; phone?: string}>>({});
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState<{ state: string; lastChanged?: number } | null>(null);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    senderName: string;
    text: string;
  } | null>(null);

  // Lock body scroll on mount to prevent browser viewport shifts
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Visual viewport height tracking for mobile virtual keyboard support
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const vv = window.visualViewport;
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (vv) {
        // If visual viewport height is significantly less than window.innerHeight, keyboard is open
        const open = vv.height < window.innerHeight - 100;
        setIsKeyboardOpen(open);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }
    window.addEventListener("resize", handleResize);
    
    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/chat");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const threadsRef = ref(database, `users/${user.uid}/chats`);
    const threadsQuery = query(threadsRef, orderByChild("timestamp"));
    const unsubscribe = onValue(threadsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data)
          .map(([id, val]: [string, any]) => ({ id, ...val }))
          .reverse();
        setThreads(list);
      } else {
        setThreads([]);
      }
    });
    return () => off(threadsRef, "value", unsubscribe);
  }, [user]);

  const activeThread = useMemo(() => {
    return threads.find((t) => t.id === activeThreadId) ||
      (initiatingProduct && activeThreadId?.includes(initiatingProduct._id) ? {
        id: activeThreadId!,
        productId: initiatingProduct._id,
        productTitle: initiatingProduct.title,
        otherUserId: (initiatingProduct.sellerId as any).firebaseUid || (initiatingProduct.sellerId as any)._id,
        otherUserName: (initiatingProduct.sellerId as any).name,
        lastMessage: "",
        timestamp: Date.now(),
        unread: 0,
      } : null);
  }, [threads, activeThreadId, initiatingProduct]);

  // Auto‑focus the message input whenever a thread becomes active (e.g., user opens a chat)
  useEffect(() => {
    if (activeThread && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeThread]);

  // Fetch profile details for all participants and cache them
  useEffect(() => {
    async function fetchProfiles() {
      // 1. Fetch active thread user profile
      if (activeThread && activeThread.otherUserId) {
        const uid = activeThread.otherUserId;
        if (!profiles[uid]) {
          const profile = await getUserProfile(uid);
          if (profile) {
            setProfiles((prev) => ({
              ...prev,
              [uid]: { avatar: profile.avatar || undefined, phone: profile.phone || undefined }
            }));
          }
        }
      }

      // 2. Fetch sidebar thread profiles in the background
      threads.forEach(async (thread) => {
        if (thread.otherUserId && !profiles[thread.otherUserId]) {
          const profile = await getUserProfile(thread.otherUserId);
          if (profile) {
            setProfiles((prev) => ({
              ...prev,
              [thread.otherUserId]: { avatar: profile.avatar || undefined, phone: profile.phone || undefined }
            }));
          }
        }
      });
    }

    fetchProfiles();
  }, [activeThread, threads, profiles]);

  const sellerInfo = useMemo(() => {
    if (activeThread && profiles[activeThread.otherUserId]) {
      return profiles[activeThread.otherUserId];
    }
    if (initiatingProduct) {
      const seller = initiatingProduct.sellerId as any;
      return {
        avatar: seller.avatar || undefined,
        phone: seller.phone || undefined
      };
    }
    return undefined;
  }, [activeThread, profiles, initiatingProduct]);

  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return; }
    const messagesRef = ref(database, `messages/${activeThreadId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
      } else {
        setMessages([]);
      }
    });
    return () => off(messagesRef, "value", unsubscribe);
  }, [activeThreadId]);
 
  // Listen for typing indicator of the other user in real time
  useEffect(() => {
    if (!activeThreadId || !activeThread?.otherUserId) {
      setIsOtherUserTyping(false);
      return;
    }
    const otherUserId = activeThread.otherUserId;
    const typingRef = ref(database, `typing/${activeThreadId}/${otherUserId}`);
    const unsubscribe = onValue(typingRef, (snapshot) => {
      setIsOtherUserTyping(!!snapshot.val());
    });
    return () => {
      off(typingRef, "value", unsubscribe);
      setIsOtherUserTyping(false);
    };
  }, [activeThreadId, activeThread]);

  // Online presence tracking with disconnect hooks
  useEffect(() => {
    if (!user) return;
    const statusRef = ref(database, `status/${user.uid}`);
    
    // Set status to online
    set(statusRef, {
      state: "online",
      lastChanged: serverTimestamp(),
    }).catch(() => {});

    // Queue offline updates on disconnect
    onDisconnect(statusRef).set({
      state: "offline",
      lastChanged: serverTimestamp(),
    }).catch(() => {});

    // Set offline when unmounting or changing user
    return () => {
      set(statusRef, {
        state: "offline",
        lastChanged: serverTimestamp(),
      }).catch(() => {});
    };
  }, [user]);

  // Real-time status listener for the other user in active chat thread
  useEffect(() => {
    if (!activeThreadId || !activeThread?.otherUserId) {
      setOtherUserStatus(null);
      return;
    }
    const otherUserId = activeThread.otherUserId;
    const otherUserStatusRef = ref(database, `status/${otherUserId}`);
    const unsubscribe = onValue(otherUserStatusRef, (snapshot) => {
      const val = snapshot.val();
      if (val) {
        setOtherUserStatus({
          state: val.state || "offline",
          lastChanged: val.lastChanged,
        });
      } else {
        setOtherUserStatus({ state: "offline" });
      }
    });
    return () => {
      off(otherUserStatusRef, "value", unsubscribe);
      setOtherUserStatus(null);
    };
  }, [activeThreadId, activeThread]);

  // Mark received messages as seen and reset unread count when actively viewing this thread
  useEffect(() => {
    if (!activeThreadId || !user) return;

    // Reset unread count for this thread in user's chat list
    try {
      update(ref(database, `users/${user.uid}/chats/${activeThreadId}`), {
        unread: 0
      });
    } catch (err) {}

    if (messages.length === 0) return;

    messages.forEach((msg) => {
      if (msg.senderId !== user.uid && msg.status !== "seen") {
        try {
          update(ref(database, `messages/${activeThreadId}/${msg.id}`), {
            status: "seen"
          });
        } catch (err) {}
      }
    });
  }, [messages, activeThreadId, user]);

  // Auto-scroll messages feed to bottom on new messages, typing, thread change, or viewport resize (keyboard up/down)
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOtherUserTyping, activeThreadId, isKeyboardOpen]);

  useEffect(() => {
    if (productId && user) {
      getProductById(productId).then((product) => {
        if (product) {
          const seller = product.sellerId as any;
          if (seller._id === user.uid || seller.firebaseUid === user.uid) return;
          setInitiatingProduct(product);
          const existing = threads.find((t) => t.productId === productId && t.otherUserId === (seller.firebaseUid || seller._id));
          if (existing) {
            setActiveThreadId(existing.id);
            setIsMobileChatOpen(true);
          } else {
            const otherId = seller.firebaseUid || seller._id;
            const tempId = [user.uid, otherId].sort().join("_") + "_" + productId;
            setActiveThreadId(tempId);
            setIsMobileChatOpen(true);
          }
        }
      });
    }
  }, [productId, user, threads]);

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }


  async function sendMessage() {
    if (!text.trim() || !activeThread || !user) return;
    const messageText = text.trim();
    setText("");

    // Maintain input focus so keyboard stays open on mobile
    inputRef.current?.focus();

    const conversationId = activeThread.id;
    
    // Reset typing state immediately in database upon sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    try {
      set(ref(database, `typing/${conversationId}/${user.uid}`), false);
    } catch (err) {}

    // Check if the other user is online to set initial status
    let initialStatus = "sent";
    try {
      const statusSnapshot = await get(ref(database, `status/${activeThread.otherUserId}`));
      const val = statusSnapshot.val();
      if (val && val.state === "online") {
        initialStatus = "delivered";
      }
    } catch (err) {}

    try {
      const messagePayload: any = {
        senderId: user.uid,
        text: messageText,
        timestamp: serverTimestamp(),
        status: initialStatus,
      };

      if (replyingTo) {
        messagePayload.replyToId = replyingTo.id;
        messagePayload.replyToSender = replyingTo.senderName;
        messagePayload.replyToText = replyingTo.text;
      }

      await push(ref(database, `messages/${conversationId}`), messagePayload);
      setReplyingTo(null);
    } catch (dbErr) {
      console.error("Firebase write to messages failed:", dbErr);
    }

    const updateConv = async (uid: string, otherUid: string, otherName: string, isSender: boolean) => {
      try {
        let unreadCount = 0;
        if (!isSender) {
          const snapshot = await get(ref(database, `users/${uid}/chats/${conversationId}/unread`));
          unreadCount = (snapshot.val() || 0) + 1;
        }

        await set(ref(database, `users/${uid}/chats/${conversationId}`), {
          productId: activeThread.productId,
          productTitle: activeThread.productTitle,
          otherUserId: otherUid,
          otherUserName: otherName,
          lastMessage: messageText,
          timestamp: serverTimestamp(),
          unread: unreadCount,
        });
      } catch (dbErr) {
        console.warn(`Could not update chats list for user: ${uid}. Verify Firebase Realtime Database Security Rules if PERMISSION_DENIED occurs. Error:`, dbErr);
      }
    };
    await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName, true);
    await updateConv(activeThread.otherUserId, user.uid, user.displayName || "User", false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeThread || !user) return;

    setIsUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));
      if (urls.length > 0) {
        const conversationId = activeThread.id;
        // Check if the other user is online to set initial status
        let initialStatus = "sent";
        try {
          const statusSnapshot = await get(ref(database, `status/${activeThread.otherUserId}`));
          const val = statusSnapshot.val();
          if (val && val.state === "online") {
            initialStatus = "delivered";
          }
        } catch (err) {}

        try {
          const imagePayload: any = {
            senderId: user.uid,
            text: "📷 Image",
            imageUrl: urls[0],
            timestamp: serverTimestamp(),
            status: initialStatus,
          };

          if (replyingTo) {
            imagePayload.replyToId = replyingTo.id;
            imagePayload.replyToSender = replyingTo.senderName;
            imagePayload.replyToText = replyingTo.text;
          }

          await push(ref(database, `messages/${conversationId}`), imagePayload);
          setReplyingTo(null);
        } catch (dbErr) {
          console.error("Firebase write to messages failed:", dbErr);
        }

        const updateConv = async (uid: string, otherUid: string, otherName: string, isSender: boolean) => {
          try {
            let unreadCount = 0;
            if (!isSender) {
              const snapshot = await get(ref(database, `users/${uid}/chats/${conversationId}/unread`));
              unreadCount = (snapshot.val() || 0) + 1;
            }

            await set(ref(database, `users/${uid}/chats/${conversationId}`), {
              productId: activeThread.productId,
              productTitle: activeThread.productTitle,
              otherUserId: otherUid,
              otherUserName: otherName,
              lastMessage: "📷 Image",
              timestamp: serverTimestamp(),
              unread: unreadCount,
            });
          } catch (dbErr) {
            console.warn(`Could not update chats list for user: ${uid}. Verify Firebase Realtime Database Security Rules if PERMISSION_DENIED occurs. Error:`, dbErr);
          }
        };
        await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName, true);
        await updateConv(activeThread.otherUserId, user.uid, user.displayName || "User", false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      
      // Add dynamic flash highlight effect
      element.classList.add("animate-highlight-flash");
      setTimeout(() => {
        element.classList.remove("animate-highlight-flash");
      }, 1500);
    }
  };

  const handleFocus = () => {
    // Force visual viewport scroll to 0 to prevent mobile browsers from shifting the page layout
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
    }, 50);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (!activeThreadId || !user) return;

    // Set typing state to true in Firebase Realtime Database
    try {
      set(ref(database, `typing/${activeThreadId}/${user.uid}`), true);
    } catch (err) {
      console.warn("Could not set typing state:", err);
    }

    // Debounce resetting typing state to false after 2 seconds of no keypress
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      try {
        await set(ref(database, `typing/${activeThreadId}/${user.uid}`), false);
      } catch (err) {
        console.warn("Could not reset typing state:", err);
      }
    }, 2000);
  };

  // Cleanup typing state on active thread change or page unmount
  useEffect(() => {
    return () => {
      if (activeThreadId && user) {
        set(ref(database, `typing/${activeThreadId}/${user.uid}`), false).catch(() => {});
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeThreadId, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeThreadId) {
        sessionStorage.setItem("activeChatThreadId", activeThreadId);
      } else {
        sessionStorage.removeItem("activeChatThreadId");
      }
    }
    return () => {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("activeChatThreadId");
      }
    };
  }, [activeThreadId]);

  return ( 
    <main 
      className="bg-surface-secondary md:static fixed left-0 right-0 overflow-hidden flex flex-col md:h-[calc(100vh-60px)]" 
      style={isMobile ? {
        top: isMobileChatOpen ? "0px" : "56px",
        bottom: isMobileChatOpen ? "0px" : "58px",
        zIndex: isMobileChatOpen ? 55 : 40
      } : {
        height: "calc(100vh - 60px)"
      }}
    >
      <div className="mx-auto grid max-w-7xl gap-0 md:gap-4 p-0 md:p-4 h-full md:grid-cols-[340px_1fr]">

        {/* Thread Sidebar */}
        <aside className={`${isMobileChatOpen ? "hidden" : "flex"} md:flex flex-col md:rounded-2xl border-0 md:border border-border/10 bg-white shadow-soft overflow-hidden dark:bg-white/5`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
            <h1 className="text-xl font-black text-ink sm:text-2xl">Messages</h1>
            <span className="rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10">
              {threads.length} chats
            </span>
          </div>

          <label className="mx-4 mt-4 mb-3 flex items-center gap-3 rounded-xl border border-border/10 bg-surface-secondary px-3 py-2.5 focus-within:border-orange-300 transition-smooth">
            <Search size={17} className="text-ink-tertiary shrink-0" />
            <input
              placeholder="Search conversations..."
              className="w-full border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0 outline-none text-ink"
            />
          </label>

          <div className="flex-1 overflow-y-auto space-y-1 px-2 pb-2">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12 px-4">
                <MessageCircle size={36} className="text-ink-tertiary" />
                <div>
                  <p className="font-bold text-ink text-sm">No messages yet</p>
                  <p className="text-xs text-ink-secondary mt-1">
                    When you message a seller or a buyer contacts you, it'll appear here.
                  </p>
                </div>
                <Link href="/" className="btn-primary text-sm py-2 px-4">Browse Listings</Link>
              </div>
            ) : (
              threads.map((thread) => (
                <motion.button
                  key={thread.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => { setActiveThreadId(thread.id); setIsMobileChatOpen(true); }}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-smooth ${
                    thread.id === activeThreadId ? "bg-orange-50 dark:bg-orange-500/10" : "hover:bg-surface-secondary"
                  }`}
                >
                  <div className="relative shrink-0 h-11 w-11 rounded-xl overflow-hidden bg-gradient-primary flex items-center justify-center text-white font-black text-base">
                    {profiles[thread.otherUserId]?.avatar ? (
                      <img
                        src={profiles[thread.otherUserId].avatar}
                        alt={`${thread.otherUserName}'s avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      thread.otherUserName[0]?.toUpperCase()
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink text-sm">{thread.productTitle}</span>
                    <span className="block truncate text-xs text-ink-secondary">{thread.lastMessage}</span>
                  </span>
                  {thread.unread > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-black text-white">
                      {thread.unread}
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Window */}
        <section className={`${isMobileChatOpen ? "flex" : "hidden"} md:flex flex-col overflow-hidden md:rounded-2xl border-0 md:border border-border/10 bg-white shadow-soft dark:bg-white/5`}>
          {activeThread ? (
            <>
              {/* Header */}
              <header className="flex items-center justify-between border-b border-border/10 px-4 py-3 sm:px-5 sm:py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    onClick={() => { setIsMobileChatOpen(false); setActiveThreadId(null); }}
                    className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth"
                  >
                    <ArrowLeft size={19} />
                  </button>
                  <div className="h-10 w-10 min-w-0">
                    {sellerInfo?.avatar ? (
                      <img
                        src={sellerInfo.avatar}
                        alt={`${activeThread?.otherUserName}'s avatar`}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-lg shrink-0">
                        {activeThread.otherUserName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate font-bold text-ink text-sm sm:text-base leading-snug">{activeThread.otherUserName}</h2>
                      <span className="flex items-center gap-0.5 rounded bg-orange-50 px-1 py-0.5 text-[10px] font-bold text-orange-500 dark:bg-orange-500/10">
                        <ShieldCheck size={10} className="shrink-0" /> Verified
                      </span>
                    </div>
                    {otherUserStatus?.state === "online" ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold leading-none mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        online
                      </div>
                    ) : (
                      <div className="text-[11px] text-ink-tertiary font-medium leading-none mt-0.5 select-none">
                        {formatLastSeen(otherUserStatus?.lastChanged)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      const phoneNumber = sellerInfo?.phone || (initiatingProduct?.sellerId as any)?.phone;
                      if (phoneNumber) {
                        window.open(`https://wa.me/91${phoneNumber.replace(/\s+/g, '')}`, '_blank');
                      }
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth text-ink-secondary"
                    aria-label="Call"
                    title="Call on WhatsApp"
                  >
                    <Phone size={18} />
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth text-ink-secondary" aria-label="More">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </header>

              {/* Item info bar */}
              <div className="border-b border-border/10 bg-orange-50 px-4 py-2.5 dark:bg-orange-500/5">
                <div className="flex items-center justify-between gap-4">
                  <p className="truncate font-bold text-ink text-sm">{activeThread.productTitle}</p>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-bold text-orange-500 shadow-soft dark:bg-white/10">
                    <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" /> Active
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f6f3] p-4 flex flex-col dark:bg-slate-900/50">
                <div className="flex justify-center mb-2">
                  <span className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-ink-tertiary border border-border/10 dark:bg-white/10">
                    Conversation started
                  </span>
                </div>
                {messages.map((msg) => {
                  const mine = msg.senderId === user.uid;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div 
                      key={msg.id} 
                      id={`msg-${msg.id}`}
                      className={`flex items-center gap-2 group ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {/* For own messages, show reply button on left side */}
                      {mine && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo({
                              id: msg.id,
                              senderName: "You",
                              text: msg.text || "📷 Image",
                            });
                            // Refocus input to keep mobile keyboard open
                            inputRef.current?.focus();
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                          title="Reply to message"
                        >
                          <CornerUpLeft size={13} />
                        </button>
                      )}

                      {/* Message Bubble */}
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-soft transition-all duration-300 ${
                        mine ? "bg-gradient-primary text-white rounded-bl-lg" : "bg-white text-ink border border-border/10 rounded-br-lg dark:bg-white/10"
                      }`}>
                        {/* Reply Quote Preview inside Bubble */}
                        {msg.replyToId && (
                          <div 
                            onClick={() => scrollToMessage(msg.replyToId!)}
                            className={`mb-2 cursor-pointer rounded-lg border-l-2 px-2.5 py-1.5 text-xs transition-smooth text-left ${
                              mine 
                                ? "bg-white/10 border-white/40 text-white/90 hover:bg-white/15" 
                                : "bg-surface-secondary border-orange-500 text-ink-secondary hover:bg-surface-tertiary dark:bg-white/5 dark:hover:bg-white/10"
                            }`}
                          >
                            <span className="block font-black text-[9px] uppercase tracking-wider opacity-80">
                              {msg.replyToSender}
                            </span>
                            <span className="block truncate font-medium mt-0.5">
                              {msg.replyToText}
                            </span>
                          </div>
                        )}

                        {msg.imageUrl && (
                          <img 
                            src={msg.imageUrl} 
                            alt="Chat attachment" 
                            className="max-w-full rounded-xl mb-1 object-contain max-h-60" 
                          />
                        )}
                        {msg.text && msg.text !== "📷 Image" && (
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        )}
                        <span className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${mine ? "text-white/70" : "text-ink-tertiary"}`}>
                          {time}
                          {mine && (
                            <span className="shrink-0 flex items-center gap-1 select-none">
                              {msg.status === "seen" ? (
                                <>
                                  <span className="text-sky-200/90 font-medium">Seen</span>
                                  <WhatsAppDoubleCheck size={15} className="text-sky-200" />
                                </>
                              ) : msg.status === "delivered" ? (
                                <>
                                  <span className="text-white/60 font-medium">Delivered</span>
                                  <WhatsAppDoubleCheck size={15} className="text-white/60" />
                                </>
                              ) : (
                                <>
                                  <span className="text-white/50 font-medium">Sent</span>
                                  <WhatsAppSingleCheck size={14} className="text-white/50" />
                                </>
                              )}
                            </span>
                          )}
                        </span>
                      </div>

                      {/* For other users, show reply button on right side */}
                      {!mine && (
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingTo({
                              id: msg.id,
                              senderName: activeThread.otherUserName,
                              text: msg.text || "📷 Image",
                            });
                            // Refocus input to keep mobile keyboard open
                            inputRef.current?.focus();
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                          title="Reply to message"
                        >
                          <CornerUpLeft size={13} />
                        </button>
                      )}
                    </div>
                  );
                })}
                {isOtherUserTyping && (
                  <div className="flex justify-start items-center gap-2.5 px-4 py-2.5 bg-white border border-border/10 rounded-2xl max-w-[220px] shadow-soft dark:bg-white/10 self-start mt-1">
                    <span className="text-xs font-bold text-ink-secondary">
                      {activeThread.otherUserName} is typing
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Replying To Preview Bar */}
              {replyingTo && (
                <div className="flex items-center justify-between border-t border-border/10 bg-orange-50/70 px-4 py-2 dark:bg-orange-500/5 backdrop-blur-md animate-fade-in shrink-0">
                  <div className="flex items-start gap-2.5 border-l-4 border-orange-500 pl-3 min-w-0">
                    <div className="min-w-0">
                      <span className="block text-[10px] font-black text-orange-500 uppercase tracking-wider">
                        Replying to {replyingTo.senderName}
                      </span>
                      <span className="block truncate text-xs text-ink-secondary font-semibold mt-0.5">
                        {replyingTo.text}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg hover:bg-surface-secondary text-ink-tertiary hover:text-ink transition-smooth"
                    title="Cancel reply"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Input */}
              <form
                className="flex items-center gap-2 border-t border-border/10 bg-white px-3 py-2.5 sm:px-4 sm:py-3 dark:bg-white/5"
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              >
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-ink-secondary hover:text-ink transition-smooth disabled:opacity-50"
                  aria-label="Attach"
                >
                  <Paperclip size={18} />
                </button>
                <button type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-ink-secondary hover:text-ink transition-smooth disabled:opacity-50"
                  aria-label="Image"
                >
                  <ImageIcon size={18} />
                </button>
                <input
                  ref={inputRef}
                  value={text}
                  onFocus={handleFocus}
                  onChange={handleTextInputChange}
                  placeholder={isUploading ? "Uploading image..." : "Type your message..."}
                  disabled={isUploading}
                  className="input-base flex-1 py-2.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || isUploading}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-primary text-white transition-smooth hover:shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="rounded-2xl bg-orange-50 border border-orange-100 p-6 dark:bg-orange-500/10"
              >
                <MessageCircle size={44} className="text-orange-500" />
              </motion.div>
              <h2 className="text-xl font-black text-ink sm:text-2xl">Your messages</h2>
              <p className="text-sm text-ink-secondary max-w-xs">
                Select a conversation from the sidebar, or start one by messaging a seller on any listing.
              </p>
              <Link href="/" className="btn-primary">Browse Listings</Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
