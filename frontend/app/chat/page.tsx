"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, CheckCheck, Image as ImageIcon, MessageCircle,
  MoreVertical, Paperclip, Phone, Search, Send, ShieldCheck
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ref, push, onValue, set, off, serverTimestamp, query, orderByChild } from "firebase/database";
import { database } from "@/lib/firebase";
import { getProductById } from "@/services/api";
import type { Product, User } from "@/lib/types";

interface Message {
  id: string;
  senderId: string;
  text: string;
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

// Will be replaced by real Firestore data in the future
const EMPTY_THREADS: Thread[] = [];

export default function ChatPage() {
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

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/chat");
  }, [user, loading, router]);

  // Load threads
  useEffect(() => {
    if (!user) return;

    const threadsRef = ref(database, `users/${user.uid}/chats`);
    const threadsQuery = query(threadsRef, orderByChild("timestamp"));

    const unsubscribe = onValue(threadsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const threadList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        })).reverse();
        setThreads(threadList);
      } else {
        setThreads([]);
      }
    });

    return () => off(threadsRef, "value", unsubscribe);
  }, [user]);

  // Load messages for active thread
  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(database, `messages/${activeThreadId}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const msgList = Object.entries(data).map(([id, val]: [string, any]) => ({
          id,
          ...val,
        }));
        setMessages(msgList);
      } else {
        setMessages([]);
      }
    });

    return () => off(messagesRef, "value", unsubscribe);
  }, [activeThreadId]);

  // Handle product initiation
  useEffect(() => {
    if (productId && user) {
      getProductById(productId).then((product) => {
        if (product) {
          const seller = product.sellerId as any;
          // Check if seller is the current user themselves
          if (seller._id === user.uid || seller.firebaseUid === user.uid) {
            console.warn("Cannot chat with yourself");
            return;
          }

          setInitiatingProduct(product);
          
          // Check if thread already exists
          const existingThread = threads.find(t => t.productId === productId && t.otherUserId === (seller.firebaseUid || seller._id));
          if (existingThread) {
            setActiveThreadId(existingThread.id);
            setIsMobileChatOpen(true);
          } else {
            // Create a temporary conversation ID
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

  const activeThread = threads.find((t) => t.id === activeThreadId) || 
    (initiatingProduct && activeThreadId?.includes(initiatingProduct._id) ? {
      id: activeThreadId,
      productId: initiatingProduct._id,
      productTitle: initiatingProduct.title,
      otherUserId: (initiatingProduct.sellerId as any).firebaseUid || (initiatingProduct.sellerId as any)._id,
      otherUserName: (initiatingProduct.sellerId as any).name,
      lastMessage: "",
      timestamp: Date.now(),
      unread: 0
    } : null);

  async function sendMessage() {
    if (!text.trim() || !activeThread || !user) return;

    const messageText = text.trim();
    setText("");

    const conversationId = activeThread.id;
    const messagesRef = ref(database, `messages/${conversationId}`);
    
    // Push new message
    await push(messagesRef, {
      senderId: user.uid,
      text: messageText,
      timestamp: serverTimestamp(),
    });

    // Update conversation metadata for both users
    const updateConversation = (uid: string, otherUid: string, otherName: string) => {
      const convRef = ref(database, `users/${uid}/chats/${conversationId}`);
      set(convRef, {
        productId: activeThread.productId,
        productTitle: activeThread.productTitle,
        otherUserId: otherUid,
        otherUserName: otherName,
        lastMessage: messageText,
        timestamp: serverTimestamp(),
        unread: 0 // Reset for the sender, increment for receiver? Simplified for now.
      });
    };

    updateConversation(user.uid, activeThread.otherUserId, activeThread.otherUserName);
    updateConversation(activeThread.otherUserId, user.uid, user.displayName || "User");
  }

  return (
    <main className="bg-surface-secondary h-screen">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 h-[calc(100vh-80px)] md:grid-cols-[360px_1fr]">

        {/* Sidebar */}
        <aside className={`${isMobileChatOpen ? "hidden" : "flex"} md:flex flex-col rounded-2xl border border-border bg-surface-bg shadow-soft overflow-hidden`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h1 className="text-2xl font-black text-ink">Messages</h1>
            <span className="rounded-xl bg-primary-light px-2.5 py-1 text-xs font-bold text-primary">
              {threads.length} chats
            </span>
          </div>

          {/* Search */}
          <label className="mx-4 mt-4 mb-3 flex items-center gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2.5 focus-within:border-primary transition-smooth">
            <Search size={18} className="text-ink-tertiary shrink-0" />
            <input
              placeholder="Search conversations..."
              className="w-full border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0 outline-none text-ink"
            />
          </label>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto space-y-1 px-2">
            {threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12 px-4">
                <MessageCircle size={40} className="text-ink-tertiary" />
                <div>
                  <p className="font-bold text-ink">No messages yet</p>
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
                  onClick={() => {
                    setActiveThreadId(thread.id);
                    setIsMobileChatOpen(true);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-smooth ${
                    thread.id === activeThreadId ? "bg-primary-light" : "hover:bg-surface-secondary"
                  }`}
                >
                  <div className="relative shrink-0 h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-lg">
                    {thread.otherUserName[0].toUpperCase()}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-primary" />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-ink text-sm">{thread.productTitle}</span>
                    <span className="block truncate text-xs text-ink-secondary">{thread.lastMessage}</span>
                  </span>
                  {thread.unread > 0 && (
                    <span className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full bg-secondary px-2 text-xs font-black text-white">
                      {thread.unread}
                    </span>
                  )}
                </motion.button>
              ))
            )}
          </div>
        </aside>

        {/* Chat window */}
        <section className={`${isMobileChatOpen ? "flex" : "hidden"} md:flex flex-col overflow-hidden rounded-2xl border border-border bg-surface-bg shadow-soft`}>
          {activeThread ? (
            <>
              {/* Header */}
              <header className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex min-w-0 items-center gap-4">
                  <button
                    onClick={() => { setIsMobileChatOpen(false); setActiveThreadId(null); }}
                    className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-xl shrink-0">
                    {activeThread.otherUserName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-ink text-lg">{activeThread.otherUserName}</h2>
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      <ShieldCheck size={16} className="shrink-0" /> Verified Seller
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth text-ink-secondary" aria-label="Call">
                    <Phone size={20} />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth text-ink-secondary" aria-label="More">
                    <MoreVertical size={20} />
                  </button>
                </div>
              </header>

              {/* Item info bar */}
              <div className="border-b border-border bg-primary-light px-5 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{activeThread.productTitle}</p>
                    <p className="text-xs text-ink-secondary mt-0.5">Meet near library after payment confirmation</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-surface-bg px-3 py-1.5 text-xs font-bold text-primary">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" /> Active
                  </span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-surface-secondary p-4 sm:p-6 flex flex-col">
                <div className="flex justify-center mb-4">
                  <span className="rounded-lg bg-surface-bg px-3 py-1 text-xs font-semibold text-ink-tertiary border border-border">Conversation started</span>
                </div>
                {messages.map((msg) => {
                  const mine = msg.senderId === user.uid;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-xs rounded-2xl px-4 py-2.5 shadow-soft ${mine ? "bg-gradient-primary text-white rounded-bl-lg" : "bg-surface-bg text-ink border border-border rounded-br-lg"}`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        <span className={`mt-1.5 flex items-center justify-end gap-1 text-xs ${mine ? "text-white/70" : "text-ink-tertiary"}`}>
                          {time}
                          {mine && <CheckCheck size={14} className="shrink-0" />}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input */}
              <form
                className="flex items-center gap-2 border-t border-border bg-surface-bg px-4 py-3"
                onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              >
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-ink-secondary hover:text-ink transition-smooth" aria-label="Attach">
                  <Paperclip size={20} />
                </button>
                <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-ink-secondary hover:text-ink transition-smooth" aria-label="Image">
                  <ImageIcon size={20} />
                </button>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your message..."
                  className="input-base flex-1"
                />
                <button
                  type="submit"
                  disabled={!text.trim()}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-white transition-smooth hover:shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  aria-label="Send"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            /* Empty chat state */
            <div className="flex flex-col items-center justify-center flex-1 gap-4 text-center p-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="rounded-2xl bg-primary/10 border border-primary/20 p-6"
              >
                <MessageCircle size={48} className="text-primary" />
              </motion.div>
              <h2 className="text-2xl font-black text-ink">Your messages</h2>
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
