"use client";

import { Suspense, useEffect, useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCheck, Image as ImageIcon, MessageCircle,
  MoreVertical, Paperclip, Phone, Search, Send, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ref, push, onValue, set, off, serverTimestamp, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { getProductById, getUserProfile, uploadImages } from "@/services/api";
import type { Product } from "@/lib/types";

interface Message {
  id: string;
  senderId: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    const conversationId = activeThread.id;
    try {
      await push(ref(database, `messages/${conversationId}`), {
        senderId: user.uid,
        text: messageText,
        timestamp: serverTimestamp(),
      });
    } catch (dbErr) {
      console.error("Firebase write to messages failed:", dbErr);
    }

    const updateConv = async (uid: string, otherUid: string, otherName: string) => {
      try {
        await set(ref(database, `users/${uid}/chats/${conversationId}`), {
          productId: activeThread.productId,
          productTitle: activeThread.productTitle,
          otherUserId: otherUid,
          otherUserName: otherName,
          lastMessage: messageText,
          timestamp: serverTimestamp(),
          unread: 0,
        });
      } catch (dbErr) {
        console.warn(`Could not update chats list for user: ${uid}. Verify Firebase Realtime Database Security Rules if PERMISSION_DENIED occurs. Error:`, dbErr);
      }
    };
    await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName);
    await updateConv(activeThread.otherUserId, user.uid, user.displayName || "User");
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeThread || !user) return;

    setIsUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));
      if (urls.length > 0) {
        const conversationId = activeThread.id;
        try {
          await push(ref(database, `messages/${conversationId}`), {
            senderId: user.uid,
            text: "📷 Image",
            imageUrl: urls[0],
            timestamp: serverTimestamp(),
          });
        } catch (dbErr) {
          console.error("Firebase write to messages failed:", dbErr);
        }

        const updateConv = async (uid: string, otherUid: string, otherName: string) => {
          try {
            await set(ref(database, `users/${uid}/chats/${conversationId}`), {
              productId: activeThread.productId,
              productTitle: activeThread.productTitle,
              otherUserId: otherUid,
              otherUserName: otherName,
              lastMessage: "📷 Image",
              timestamp: serverTimestamp(),
              unread: 0,
            });
          } catch (dbErr) {
            console.warn(`Could not update chats list for user: ${uid}. Verify Firebase Realtime Database Security Rules if PERMISSION_DENIED occurs. Error:`, dbErr);
          }
        };
        await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName);
        await updateConv(activeThread.otherUserId, user.uid, user.displayName || "User");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="bg-surface-secondary pb-nav" style={{ height: "calc(100dvh - 60px)" }}>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 h-full md:grid-cols-[340px_1fr]">

        {/* Thread Sidebar */}
        <aside className={`${isMobileChatOpen ? "hidden" : "flex"} md:flex flex-col rounded-2xl border border-border/10 bg-white shadow-soft overflow-hidden dark:bg-white/5`}>
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
        <section className={`${isMobileChatOpen ? "flex" : "hidden"} md:flex flex-col overflow-hidden rounded-2xl border border-border/10 bg-white shadow-soft dark:bg-white/5`}>
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
                    <h2 className="truncate font-bold text-ink">{activeThread.otherUserName}</h2>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-orange-500">
                      <ShieldCheck size={14} className="shrink-0" /> Verified Seller
                    </p>
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
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-soft ${
                        mine ? "bg-gradient-primary text-white rounded-bl-lg" : "bg-white text-ink border border-border/10 rounded-br-lg dark:bg-white/10"
                      }`}>
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
                        <span className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? "text-white/70" : "text-ink-tertiary"}`}>
                          {time}
                          {mine && <CheckCheck size={12} className="shrink-0" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                  value={text}
                  onChange={(e) => setText(e.target.value)}
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
