"use client";

import { Suspense, useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MessageCircle,
  MoreVertical, Paperclip, Search, Send, ShieldCheck,
  CornerUpLeft, X, ChevronDown, Tag, ExternalLink,
  IndianRupee, CheckCircle2, XCircle, Repeat2, Lock, HandCoins, Smile,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ref, push, onValue, set, off, serverTimestamp, query, orderByChild, update, get, onDisconnect, remove } from "firebase/database";
import { database } from "@/lib/firebase";
import { getProductById, getUserProfile, uploadImages } from "@/services/api";
import type { Product } from "@/lib/types";

/* ================================================================
   Types
   ================================================================ */

interface ConversationProduct {
  title: string;
  price: number;
  image: string;
  addedAt: number;
  sellerUid?: string; // Firebase uid of the seller for this product (used for offer flow)
}

interface Thread {
  id: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  timestamp: number;
  unread: number;
  clearedAt?: number;
  deleted?: boolean;
  // New: multi-product support
  activeListingId?: string;
  products?: Record<string, ConversationProduct>;
  // Legacy single-product fields (backward compat)
  productId?: string;
  productTitle?: string;
}

type MessageKind =
  | "text"
  | "image"
  | "offer"
  | "counter"
  | "accept"
  | "decline"
  | "contact_share";

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
  listingId?: string;
  isSystemMessage?: boolean;
  // New: offer/deal flow
  kind?: MessageKind;
  offerAmount?: number;
  offerId?: string; // ID of the deal record this message belongs to
  contactKind?: "whatsapp" | "phone";
  contactValue?: string;
  // New: emoji reactions — keyed by emoji, value is map of uid -> timestamp.
  // Schema chosen so multiple users can stack the same emoji and toggling
  // is just a single-path write.
  reactions?: Record<string, Record<string, number>>;
}

type DealState = "pending" | "accepted" | "declined";

interface Deal {
  id: string;
  productId: string;
  buyerUid: string;
  sellerUid: string;
  state: DealState;
  // Latest offer (the one awaiting response)
  currentOffer: number;
  currentOfferBy: string; // uid of who made the most recent offer/counter
  history: Array<{ amount: number; by: string; at: number }>;
  createdAt: number;
  updatedAt: number;
}

/* ================================================================
   Helpers & SVG Components
   ================================================================ */

const getConversationId = (uid1: string, uid2: string) =>
  [uid1, uid2].sort().join("_");

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
  if (date.toDateString() === now.toDateString()) return `last seen today at ${timeStr}`;
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return `last seen yesterday at ${timeStr}`;
  const dateStr = date.toLocaleDateString([], { month: "short", day: "numeric" });
  return `last seen on ${dateStr} at ${timeStr}`;
};

/** Count products in a thread (handles both new and legacy format). */
const getThreadProductCount = (thread: Thread): number => {
  if (thread.products) return Object.keys(thread.products).length;
  if (thread.productId) return 1;
  return 0;
};

/** Get the products map from a thread (handles legacy format). */
const getThreadProducts = (thread: Thread): Record<string, ConversationProduct> => {
  if (thread.products) return thread.products;
  if (thread.productId) {
    return {
      [thread.productId]: {
        title: thread.productTitle || "Unknown Item",
        price: 0,
        image: "",
        addedAt: 0,
      },
    };
  }
  return {};
};

/* ---- Phone-number leak detection ----
   Blocks the user from sharing their personal contact details before a deal
   is accepted. Catches:
     - 10+ consecutive digits with optional separators (spaces, dashes, dots)
     - Indian numbers with +91 / 0 prefixes
     - Common evasions like "nine eight seven..." (word-spelled digits)
     - Contact-app deep links (wa.me, whatsapp.com, t.me, instagram dm hints)
   Returns true if the text is allowed.
*/
const DIGIT_WORDS_RE =
  /\b(zero|one|two|three|four|five|six|seven|eight|nine)\b(?:[\s,.\-]+\b(zero|one|two|three|four|five|six|seven|eight|nine)\b){6,}/i;
const PHONE_LIKE_RE = /(?:\+?\d[\s\-.()]*){10,}/;
const CONTACT_URL_RE =
  /\b(?:wa\.me|whatsapp\.com|chat\.whatsapp\.com|t\.me|telegram\.me|signal\.me|instagram\.com\/(?:direct|[\w._]+)|m\.me|messenger\.com)\b/i;

function detectContactLeak(text: string, ownPhone?: string): null | string {
  if (!text) return null;
  const lower = text.toLowerCase();

  if (CONTACT_URL_RE.test(lower)) {
    return "Sharing contact links isn't allowed before a deal is accepted.";
  }

  // Strip everything except digits to catch obfuscated numbers like "9-8-7 6 5 4..."
  const digitsOnly = text.replace(/\D/g, "");
  if (digitsOnly.length >= 10) {
    if (PHONE_LIKE_RE.test(text) || /\d{10,}/.test(digitsOnly)) {
      return "Phone numbers can be shared only after the deal is accepted.";
    }
  }

  if (DIGIT_WORDS_RE.test(text)) {
    return "Phone numbers can be shared only after the deal is accepted.";
  }

  // User's own profile number (handle separators)
  if (ownPhone) {
    const ownDigits = ownPhone.replace(/\D/g, "");
    if (ownDigits.length >= 6 && digitsOnly.includes(ownDigits)) {
      return "You can't share your own phone number before the deal is accepted.";
    }
  }

  return null;
}

/* ================================================================
   Page Wrapper
   ================================================================ */

export default function ChatPage() {
  return (
    <Suspense fallback={<main className="grid min-h-screen place-items-center bg-background text-ink">Loading messages...</main>}>
      <ChatPageContent />
    </Suspense>
  );
}

/* ================================================================
   Main Chat Content
   ================================================================ */

function ChatPageContent() {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("product");

  /* ---- Core state ---- */
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoaded, setThreadsLoaded] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [text, setText] = useState("");
  const [initiatingProduct, setInitiatingProduct] = useState<Product | null>(null);
  const [profiles, setProfiles] = useState<Record<string, { avatar?: string; phone?: string; name?: string; isDeleted?: boolean }>>({});
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [otherUserStatus, setOtherUserStatus] = useState<{ state: string; lastChanged?: number } | null>(null);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; senderName: string; text: string } | null>(null);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ---- Product context state ---- */
  const [showProductSwitcher, setShowProductSwitcher] = useState(false);
  const productSwitcherRef = useRef<HTMLDivElement>(null);
  const processedProductRef = useRef<string | null>(null);

  /* ---- Deal / Offer flow state ---- */
  const [deals, setDeals] = useState<Record<string, Deal>>({}); // keyed by productId
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerInput, setOfferInput] = useState("");
  const [offerError, setOfferError] = useState<string | null>(null); // modal validation only
  const [leakWarning, setLeakWarning] = useState<string | null>(null); // phone-share guard banner
  const [contactBanner, setContactBanner] = useState<string | null>(null); // misc info banner

  /* ---- Reactions state ---- */
  // Quick-pick emoji reactions; tweakable list. Trimmed to common chat reactions.
  const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"] as const;
  // Currently open reaction picker; either null or the message id
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement>(null);

  /* ================================================================
     Derived / Computed
     ================================================================ */

  const activeThread = useMemo(() => {
    const existing = threads.find((t) => t.id === activeThreadId);
    if (existing) return existing;

    // Temporary thread for a newly initiated conversation not yet in Firebase
    if (initiatingProduct && activeThreadId) {
      const seller = typeof initiatingProduct.sellerId === "string"
        ? { _id: initiatingProduct.sellerId } as any
        : initiatingProduct.sellerId as any;
      const sellerUid = seller.firebaseUid || seller._id;
      return {
        id: activeThreadId,
        otherUserId: sellerUid,
        otherUserName: seller.name || "User",
        lastMessage: "",
        timestamp: Date.now(),
        unread: 0,
        activeListingId: initiatingProduct._id,
        products: {
          [initiatingProduct._id]: {
            title: initiatingProduct.title,
            price: initiatingProduct.price,
            image: initiatingProduct.images?.[0] || "",
            addedAt: Date.now(),
            sellerUid,
          },
        },
      } as Thread;
    }
    return null;
  }, [threads, activeThreadId, initiatingProduct]);

  /** All products in the active conversation. */
  const threadProducts = useMemo(() => {
    if (!activeThread) return {} as Record<string, ConversationProduct>;
    return getThreadProducts(activeThread);
  }, [activeThread]);

  /** The currently selected listing ID. Falls back to first product or legacy productId. */
  const activeListingId = useMemo(() => {
    if (!activeThread) return null;
    if (activeThread.activeListingId && threadProducts[activeThread.activeListingId]) {
      return activeThread.activeListingId;
    }
    const keys = Object.keys(threadProducts);
    if (keys.length > 0) return keys[0];
    return activeThread.productId || null;
  }, [activeThread, threadProducts]);

  /** The currently active product details. */
  const currentProduct = useMemo(() => {
    if (!activeListingId || !threadProducts[activeListingId]) return null;
    return { id: activeListingId, ...threadProducts[activeListingId] };
  }, [activeListingId, threadProducts]);

  const productsCount = Object.keys(threadProducts).length;

  /** Deal state for the currently active product. */
  const activeDeal = useMemo<Deal | null>(() => {
    if (!activeListingId) return null;
    return deals[activeListingId] || null;
  }, [activeListingId, deals]);

  /** Are contact-share controls unlocked for the active product? */
  const contactsUnlocked = activeDeal?.state === "accepted";

  /** Is the current user the seller of the currently active product? */
  const isCurrentUserSeller = useMemo(() => {
    if (!user || !currentProduct) return false;
    if (currentProduct.sellerUid) return currentProduct.sellerUid === user.uid;
    // Legacy fallback: in a 2-person chat, the seller is whoever isn't the
    // initiator. We don't always know who initiated, so default to false.
    return false;
  }, [user, currentProduct]);

  /** Visible messages (respecting clearedAt). */
  const visibleMessages = useMemo(() => {
    return messages.filter((m) => !activeThread?.clearedAt || m.timestamp > activeThread.clearedAt);
  }, [messages, activeThread?.clearedAt]);

  const sellerInfo = useMemo(() => {
    if (activeThread && profiles[activeThread.otherUserId]) {
      return profiles[activeThread.otherUserId];
    }
    if (initiatingProduct) {
      const seller = initiatingProduct.sellerId as any;
      return { avatar: seller.avatar || undefined, phone: seller.phone || undefined };
    }
    return undefined;
  }, [activeThread, profiles, initiatingProduct]);

  /* ================================================================
     Effects
     ================================================================ */

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
      if (productSwitcherRef.current && !productSwitcherRef.current.contains(event.target as Node)) {
        setShowProductSwitcher(false);
      }
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setReactionPickerFor(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = originalStyle; };
  }, []);

  // Visual viewport height tracking for mobile keyboard
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      const vv = window.visualViewport;
      setIsMobile(window.innerWidth < 768);
      if (vv) setIsKeyboardOpen(vv.height < window.innerHeight - 100);
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

  // Auth redirect
  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/chat");
  }, [user, loading, router]);

  // Load threads from Firebase
  useEffect(() => {
    if (!user) return;
    const threadsRef = ref(database, `users/${user.uid}/chats`);
    const threadsQuery = query(threadsRef, orderByChild("timestamp"));
    const unsubscribe = onValue(
      threadsQuery,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const list = Object.entries(data)
            .map(([id, val]: [string, any]) => ({ id, ...val }))
            .reverse();
          setThreads(list);
        } else {
          setThreads([]);
        }
        setThreadsLoaded(true);
      },
      (error) => {
        console.error("[chat] Failed to subscribe to threads:", error?.message || error);
        setThreadsLoaded(true);
      }
    );
    return () => off(threadsRef, "value", unsubscribe);
  }, [user]);

  // Auto-focus input when thread becomes active
  useEffect(() => {
    if (activeThread && inputRef.current) inputRef.current.focus();
  }, [activeThread]);

  // Fetch profile details
  const fetchedProfilesRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const uidsToFetch = new Set<string>();
    if (activeThread?.otherUserId) uidsToFetch.add(activeThread.otherUserId);
    threads.forEach((t) => { if (t.otherUserId) uidsToFetch.add(t.otherUserId); });

    Array.from(uidsToFetch).forEach(async (uid) => {
      if (!fetchedProfilesRef.current.has(uid)) {
        fetchedProfilesRef.current.add(uid);
        const profile = await getUserProfile(uid);
        setProfiles((prev) => ({
          ...prev,
          [uid]: profile
            ? { avatar: profile.avatar || undefined, phone: profile.phone || undefined, name: profile.name || undefined, isDeleted: false }
            : { name: "Deleted User", isDeleted: true },
        }));
      }
    });
  }, [activeThread, threads]);

  // Listen to messages
  useEffect(() => {
    if (!activeThreadId) { setMessages([]); return; }
    const messagesRef = ref(database, `messages/${activeThreadId}`);
    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setMessages(Object.entries(data).map(([id, val]: [string, any]) => ({ id, ...val })));
        } else {
          setMessages([]);
        }
      },
      (error) => {
        console.error("[chat] Failed to subscribe to messages:", error?.message || error);
        setMessages([]);
      }
    );
    return () => off(messagesRef, "value", unsubscribe);
  }, [activeThreadId]);

  // Listen to deals for the active conversation
  useEffect(() => {
    if (!activeThreadId) { setDeals({}); return; }
    const dealsRef = ref(database, `deals/${activeThreadId}`);
    const unsubscribe = onValue(
      dealsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const map: Record<string, Deal> = {};
          Object.entries(data).forEach(([productId, val]: [string, any]) => {
            map[productId] = { id: productId, productId, ...val };
          });
          setDeals(map);
        } else {
          setDeals({});
        }
      },
      (error) => {
        // If RTDB rules don't allow /deals reads yet, silently keep an empty
        // deals map so the rest of the chat keeps working.
        console.warn("[chat] Failed to subscribe to deals:", error?.message || error);
        setDeals({});
      }
    );
    return () => off(dealsRef, "value", unsubscribe);
  }, [activeThreadId]);

  // Incoming message chime
  const playIncomingMessageChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "closed") return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine"; osc1.frequency.value = 880;
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1); gain1.connect(ctx.destination);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine"; osc2.frequency.value = 1318.51;
      gain2.gain.setValueAtTime(0.08, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc2.connect(gain2); gain2.connect(ctx.destination);
      osc1.start(now); osc2.start(now);
      osc1.stop(now + 0.8); osc2.stop(now + 0.4);
    } catch (e) { console.warn("Chime synth failed:", e); }
  }, []);

  // Offer / counter-offer chime — quick triple-tap arpeggio (distinct from message chime)
  const playOfferChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "closed") return;
      const tones = [659.25, 880, 1174.66]; // E5, A5, D6
      tones.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch (e) { console.warn("Offer chime synth failed:", e); }
  }, []);

  // Deal-accepted chime — celebratory ascending arpeggio
  const playDealChime = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "closed") return;
      const tones = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      tones.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.42);
      });
    } catch (e) { console.warn("Deal chime synth failed:", e); }
  }, []);

  // Reset the "last seen message" tracker whenever the active thread changes,
  // so we don't accidentally chime on initial load of a different thread.
  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [activeThreadId]);

  useEffect(() => {
    if (messages.length === 0 || !user) {
      if (messages.length === 0) lastMessageIdRef.current = null;
      return;
    }
    const lastMsg = messages[messages.length - 1];

    // First time we see messages for this thread (just opened): seed the ref
    // without playing a sound. This prevents the chime from firing every time
    // you open a chat that already has unread messages.
    if (lastMessageIdRef.current === null) {
      lastMessageIdRef.current = lastMsg.id;
      return;
    }

    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id;
      // Skip own messages and non-conversational events
      if (lastMsg.senderId === user.uid) return;
      if (lastMsg.senderId === "system" || lastMsg.isSystemMessage) return;
      const kind = lastMsg.kind;
      if (kind === "offer" || kind === "counter") {
        playOfferChime();
      } else if (kind === "accept") {
        playDealChime();
      } else if (kind === "decline") {
        // No chime for declines — keep it muted
      } else {
        playIncomingMessageChime();
      }
    }
  }, [messages, user, playIncomingMessageChime, playOfferChime, playDealChime]);

  // Typing indicator
  useEffect(() => {
    if (!activeThreadId || !activeThread?.otherUserId) { setIsOtherUserTyping(false); return; }
    const typingRef = ref(database, `typing/${activeThreadId}/${activeThread.otherUserId}`);
    const unsubscribe = onValue(
      typingRef,
      (snapshot) => setIsOtherUserTyping(!!snapshot.val()),
      (err) => { console.warn("[chat] typing listener error:", err?.message || err); setIsOtherUserTyping(false); }
    );
    return () => { off(typingRef, "value", unsubscribe); setIsOtherUserTyping(false); };
  }, [activeThreadId, activeThread]);

  // Online presence
  useEffect(() => {
    if (!user) return;
    const statusRef = ref(database, `status/${user.uid}`);
    set(statusRef, { state: "online", lastChanged: serverTimestamp() }).catch(() => {});
    onDisconnect(statusRef).set({ state: "offline", lastChanged: serverTimestamp() }).catch(() => {});
    return () => { set(statusRef, { state: "offline", lastChanged: serverTimestamp() }).catch(() => {}); };
  }, [user]);

  // Other user status
  useEffect(() => {
    if (!activeThreadId || !activeThread?.otherUserId) { setOtherUserStatus(null); return; }
    const otherStatusRef = ref(database, `status/${activeThread.otherUserId}`);
    const unsubscribe = onValue(
      otherStatusRef,
      (snapshot) => {
        const val = snapshot.val();
        setOtherUserStatus(val ? { state: val.state || "offline", lastChanged: val.lastChanged } : { state: "offline" });
      },
      (err) => { console.warn("[chat] status listener error:", err?.message || err); setOtherUserStatus(null); }
    );
    return () => { off(otherStatusRef, "value", unsubscribe); setOtherUserStatus(null); };
  }, [activeThreadId, activeThread]);

  // Mark messages as seen & reset unread
  useEffect(() => {
    if (!activeThreadId || !user) return;
    const threadToUpdate = threads.find((t) => t.id === activeThreadId);
    if (threadToUpdate && threadToUpdate.unread > 0) {
      update(ref(database, `users/${user.uid}/chats/${activeThreadId}`), { unread: 0 }).catch(() => {});
    }
    if (messages.length === 0) return;
    messages.forEach((msg) => {
      if (msg.senderId !== user.uid && msg.senderId !== "system" && msg.status !== "seen") {
        update(ref(database, `messages/${activeThreadId}/${msg.id}`), { status: "seen" }).catch(() => {});
      }
    });
  }, [messages, activeThreadId, user, threads]);

  // Auto-scroll
  useEffect(() => {
    const timer = setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 100);
    return () => clearTimeout(timer);
  }, [messages, isOtherUserTyping, activeThreadId, isKeyboardOpen]);

  /* ---- Product Initiation (core new logic) ---- */
  useEffect(() => {
    if (!productId || !user || !dbUser || !threadsLoaded) return;
    if (processedProductRef.current === productId) return;

    (async () => {
      const product = await getProductById(productId);
      if (!product) return;

      const seller = typeof product.sellerId === "string"
        ? { _id: product.sellerId } as any
        : product.sellerId as any;
      if (!seller) return;

      // Don't chat with yourself
      const sellerEmail = seller.email?.trim().toLowerCase();
      const currentEmail = (dbUser?.email || user.email || "").trim().toLowerCase();
      const sellerMongoId = seller._id?.toString();
      const currentMongoId = dbUser?._id?.toString();
      if (
        seller.firebaseUid === user.uid ||
        sellerMongoId === currentMongoId ||
        (sellerEmail && currentEmail && sellerEmail === currentEmail)
      ) return;

      processedProductRef.current = productId;
      setInitiatingProduct(product);

      const sellerUid = seller.firebaseUid || seller._id;

      // Find any existing conversation with this seller (new or old format)
      const existingThread = threads.find((t) => t.otherUserId === sellerUid);
      const convId = existingThread ? existingThread.id : getConversationId(user.uid, sellerUid);

      // Prepare product data
      const productData: ConversationProduct = {
        title: product.title,
        price: product.price,
        image: product.images?.[0] || "",
        addedAt: Date.now(),
        sellerUid,
      };

      // Check if conversation already exists in Firebase
      const convSnapshot = await get(ref(database, `users/${user.uid}/chats/${convId}`));
      const convData = convSnapshot.val();
      const existingProducts = convData?.products || {};
      const isNewProduct = !existingProducts[productId];

      // Add product to both users' product maps
      await set(ref(database, `users/${user.uid}/chats/${convId}/products/${productId}`), productData);
      await set(ref(database, `users/${sellerUid}/chats/${convId}/products/${productId}`), productData);

      // Set conversation metadata for current user
      const buyerUpdate: any = {
        otherUserId: sellerUid,
        otherUserName: seller.name || "User",
        activeListingId: productId,
      };
      if (!convData) {
        buyerUpdate.lastMessage = "";
        buyerUpdate.timestamp = serverTimestamp();
        buyerUpdate.unread = 0;
      }
      await update(ref(database, `users/${user.uid}/chats/${convId}`), buyerUpdate);

      // Set conversation metadata for seller
      const sellerSnapshot = await get(ref(database, `users/${sellerUid}/chats/${convId}`));
      if (!sellerSnapshot.val()) {
        await update(ref(database, `users/${sellerUid}/chats/${convId}`), {
          otherUserId: user.uid,
          otherUserName: dbUser?.name || user.displayName || "User",
          lastMessage: "",
          timestamp: serverTimestamp(),
          unread: 0,
        });
      }

      // Insert system message if this product is new to the conversation
      if (isNewProduct) {
        await push(ref(database, `messages/${convId}`), {
          senderId: "system",
          text: `📚 Started discussing: ${product.title}`,
          timestamp: serverTimestamp(),
          isSystemMessage: true,
          listingId: productId,
        });
      }

      setActiveThreadId(convId);
      setIsMobileChatOpen(true);
    })();
  }, [productId, user, dbUser, threadsLoaded, threads]);

  // Cleanup typing on thread change / unmount
  useEffect(() => {
    return () => {
      if (activeThreadId && user) {
        set(ref(database, `typing/${activeThreadId}/${user.uid}`), false).catch(() => {});
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [activeThreadId, user]);

  // Persist active thread to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (activeThreadId) sessionStorage.setItem("activeChatThreadId", activeThreadId);
      else sessionStorage.removeItem("activeChatThreadId");
    }
    return () => { if (typeof window !== "undefined") sessionStorage.removeItem("activeChatThreadId"); };
  }, [activeThreadId]);

  /* ================================================================
     Handlers
     ================================================================ */

  const handleClearChat = async () => {
    if (!user || !activeThreadId || !activeThread) return;
    if (!window.confirm("Are you sure you want to clear messages in this chat? They will only be deleted for you.")) return;
    try {
      await update(ref(database, `users/${user.uid}/chats/${activeThreadId}`), { clearedAt: Date.now() });
      setShowDropdown(false);
    } catch (error) { console.error("Failed to clear chat:", error); }
  };

  const handleDeleteChat = async () => {
    if (!user || !activeThreadId) return;
    if (!window.confirm("Are you sure you want to delete this chat? This action cannot be undone.")) return;
    try {
      await remove(ref(database, `users/${user.uid}/chats/${activeThreadId}`));
      setActiveThreadId(null);
      setIsMobileChatOpen(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Failed to delete chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  const handleSwitchProduct = async (newProductId: string) => {
    if (!user || !activeThreadId) return;
    try {
      await update(ref(database, `users/${user.uid}/chats/${activeThreadId}`), { activeListingId: newProductId });
    } catch (err) { console.warn("Failed to switch product:", err); }
    setShowProductSwitcher(false);
  };

  /** Toggle the current user's reaction with a given emoji on a message.
   *  Rules:
   *   - One reaction per user per message.
   *   - Clicking the same emoji you already reacted with → clears it.
   *   - Clicking a different emoji → replaces your existing reaction.
   */
  const handleToggleReaction = async (messageId: string, emoji: string) => {
    if (!user || !activeThreadId) return;
    try {
      // Find any existing reaction by this user on this message
      const reactionsSnap = await get(
        ref(database, `messages/${activeThreadId}/${messageId}/reactions`),
      );
      const reactionsData = (reactionsSnap.val() || {}) as Record<string, Record<string, number>>;
      const existingEmoji = Object.keys(reactionsData).find(
        (em) => reactionsData[em] && reactionsData[em][user.uid] != null,
      );

      const writes: Promise<unknown>[] = [];
      // If user already has a reaction, remove it first.
      if (existingEmoji) {
        writes.push(
          remove(ref(database, `messages/${activeThreadId}/${messageId}/reactions/${existingEmoji}/${user.uid}`)),
        );
      }
      // Toggle behavior: same emoji means just remove (already done above).
      // Different emoji means add the new one.
      if (existingEmoji !== emoji) {
        writes.push(
          set(
            ref(database, `messages/${activeThreadId}/${messageId}/reactions/${emoji}/${user.uid}`),
            Date.now(),
          ),
        );
      }
      await Promise.all(writes);
    } catch (err) {
      console.warn("Failed to toggle reaction:", err);
    }
    setReactionPickerFor(null);
  };

  /* ---- Offer / Deal handlers ---- */

  /** Update the lastMessage/timestamp/unread on both users' thread metadata. */
  const bumpThreadMeta = useCallback(async (
    conversationId: string,
    otherUid: string,
    preview: string,
  ) => {
    if (!user) return;
    try {
      const updates = [
        update(ref(database, `users/${user.uid}/chats/${conversationId}`), {
          otherUserId: otherUid,
          lastMessage: preview,
          timestamp: serverTimestamp(),
          deleted: false,
        }),
      ];
      // Bump other user with unread increment
      const otherChatRef = ref(database, `users/${otherUid}/chats/${conversationId}`);
      const snap = await get(otherChatRef);
      const cur = snap.val() || {};
      updates.push(update(otherChatRef, {
        otherUserId: user.uid,
        otherUserName: dbUser?.name || user.displayName || "User",
        lastMessage: preview,
        timestamp: serverTimestamp(),
        unread: (cur.unread || 0) + 1,
        deleted: false,
      }));
      await Promise.all(updates);
    } catch (e) { console.warn("Failed to bump thread meta:", e); }
  }, [user, dbUser]);

  const handleSendOffer = async (amount: number) => {
    if (!user || !activeThread || !activeListingId || !currentProduct) return;
    const conversationId = activeThread.id;
    const productId = activeListingId;
    const sellerUid = currentProduct.sellerUid || activeThread.otherUserId; // best-effort
    const buyerUid = sellerUid === user.uid ? activeThread.otherUserId : user.uid;

    const existing = deals[productId];
    const isCounter = !!existing && existing.state === "pending";
    const now = Date.now();

    const dealUpdate: any = {
      buyerUid,
      sellerUid,
      state: "pending",
      currentOffer: amount,
      currentOfferBy: user.uid,
      updatedAt: serverTimestamp(),
    };
    if (!existing) {
      dealUpdate.createdAt = serverTimestamp();
    }
    const historyEntry = { amount, by: user.uid, at: now };
    const historyKey = `history/${(existing?.history?.length || 0)}`;

    try {
      await update(ref(database, `deals/${conversationId}/${productId}`), dealUpdate);
      await set(ref(database, `deals/${conversationId}/${productId}/${historyKey}`), historyEntry);
    } catch (e) {
      console.error("Failed to write deal:", e);
      return;
    }

    // Push offer message
    const kind: MessageKind = isCounter ? "counter" : "offer";
    const labelPrefix = kind === "counter" ? "Counter offer" : "Offer";
    const previewText = `💰 ${labelPrefix}: ₹${amount.toLocaleString("en-IN")}`;
    try {
      await push(ref(database, `messages/${conversationId}`), {
        senderId: user.uid,
        text: previewText,
        timestamp: serverTimestamp(),
        status: "sent",
        listingId: productId,
        kind,
        offerAmount: amount,
        offerId: productId,
      });
    } catch (e) { console.error("Failed to push offer message:", e); }

    await bumpThreadMeta(conversationId, activeThread.otherUserId, previewText);
    setShowOfferModal(false);
    setOfferInput("");
    setOfferError(null);
  };

  const handleAcceptOffer = async (productId: string, amount: number) => {
    if (!user || !activeThread) return;
    const conversationId = activeThread.id;
    try {
      await update(ref(database, `deals/${conversationId}/${productId}`), {
        state: "accepted",
        updatedAt: serverTimestamp(),
      });
      await push(ref(database, `messages/${conversationId}`), {
        senderId: user.uid,
        text: `🎉 Deal accepted at ₹${amount.toLocaleString("en-IN")} — you can now exchange contact details.`,
        timestamp: serverTimestamp(),
        status: "sent",
        listingId: productId,
        kind: "accept",
        offerAmount: amount,
        offerId: productId,
      });
    } catch (e) { console.error("Failed to accept offer:", e); return; }
    await bumpThreadMeta(conversationId, activeThread.otherUserId, `🎉 Deal accepted at ₹${amount.toLocaleString("en-IN")}`);
  };

  const handleDeclineOffer = async (productId: string) => {
    if (!user || !activeThread) return;
    const conversationId = activeThread.id;
    try {
      await update(ref(database, `deals/${conversationId}/${productId}`), {
        state: "declined",
        updatedAt: serverTimestamp(),
      });
      await push(ref(database, `messages/${conversationId}`), {
        senderId: user.uid,
        text: `❌ Offer declined.`,
        timestamp: serverTimestamp(),
        status: "sent",
        listingId: productId,
        kind: "decline",
        offerId: productId,
      });
    } catch (e) { console.error("Failed to decline offer:", e); return; }
    await bumpThreadMeta(conversationId, activeThread.otherUserId, "❌ Offer declined");
  };

  const handleShareContact = async (kind: "whatsapp" | "phone") => {
    if (!user || !activeThread || !activeListingId) return;
    const phone = dbUser?.phone;
    if (!phone) {
      setContactBanner("Add a phone number to your profile first.");
      setTimeout(() => setContactBanner(null), 4000);
      return;
    }
    const conversationId = activeThread.id;
    const label = kind === "whatsapp" ? "📱 WhatsApp" : "📞 Phone";
    try {
      await push(ref(database, `messages/${conversationId}`), {
        senderId: user.uid,
        text: `${label}: ${phone}`,
        timestamp: serverTimestamp(),
        status: "sent",
        listingId: activeListingId,
        kind: "contact_share",
        contactKind: kind,
        contactValue: phone,
      });
    } catch (e) { console.error("Failed to share contact:", e); return; }
    await bumpThreadMeta(conversationId, activeThread.otherUserId, `${label}: ${phone}`);
  };

  const openOfferModal = () => {
    if (!currentProduct) return;
    // If we're countering a pending offer, prefill with that amount as a
    // sensible starting point. Otherwise suggest 90% of listing price.
    const pendingDeal = deals[currentProduct.id];
    let suggested: number;
    if (pendingDeal && pendingDeal.state === "pending") {
      suggested = pendingDeal.currentOffer;
    } else {
      suggested = Math.max(1, Math.round((currentProduct.price || 0) * 0.9));
    }
    setOfferInput(String(suggested || ""));
    setOfferError(null);
    setShowOfferModal(true);
  };

  const handleFocus = () => {
    setTimeout(() => { window.scrollTo(0, 0); document.body.scrollTop = 0; }, 50);
  };

  const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!activeThreadId || !user) return;
    try { set(ref(database, `typing/${activeThreadId}/${user.uid}`), true); } catch (err) {}
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(async () => {
      try { await set(ref(database, `typing/${activeThreadId}/${user.uid}`), false); } catch (err) {}
    }, 2000);
  };

  const scrollToMessage = (msgId: string) => {
    const element = document.getElementById(`msg-${msgId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.classList.add("animate-highlight-flash");
      setTimeout(() => element.classList.remove("animate-highlight-flash"), 1500);
    }
  };

  async function sendMessage() {
    if (!text.trim() || !activeThread || !user) return;
    const messageText = text.trim();

    // Guard: block contact-info sharing before a deal is accepted on the
    // currently active product. Once accepted, users can still share via the
    // dedicated Share buttons; free-form text remains permissive.
    if (!contactsUnlocked) {
      const ownPhone = dbUser?.phone;
      const leak = detectContactLeak(messageText, ownPhone);
      if (leak) {
        setLeakWarning(leak);
        setTimeout(() => setLeakWarning(null), 4000);
        return;
      }
    }

    setText("");
    inputRef.current?.focus();
    const conversationId = activeThread.id;

    // Reset typing
    if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null; }
    try { set(ref(database, `typing/${conversationId}/${user.uid}`), false); } catch (err) {}

    // Check other user online for initial status
    let initialStatus = "sent";
    try {
      const statusSnapshot = await get(ref(database, `status/${activeThread.otherUserId}`));
      const val = statusSnapshot.val();
      if (val?.state === "online") initialStatus = "delivered";
    } catch (err) {}

    try {
      const messagePayload: any = {
        senderId: user.uid,
        text: messageText,
        timestamp: serverTimestamp(),
        status: initialStatus,
      };
      if (activeListingId) messagePayload.listingId = activeListingId;
      if (replyingTo) {
        messagePayload.replyToId = replyingTo.id;
        messagePayload.replyToSender = replyingTo.senderName;
        messagePayload.replyToText = replyingTo.text;
      }
      await push(ref(database, `messages/${conversationId}`), messagePayload);
      setReplyingTo(null);
    } catch (dbErr) { console.error("Firebase write to messages failed:", dbErr); }

    const updateConv = async (uid: string, otherUid: string, otherName: string, isSender: boolean) => {
      try {
        const chatRef = ref(database, `users/${uid}/chats/${conversationId}`);
        const snapshot = await get(chatRef);
        const currentData = snapshot.val() || {};
        const updateData: any = {
          otherUserId: otherUid || "",
          otherUserName: otherName || "User",
          lastMessage: messageText || "",
          timestamp: serverTimestamp(),
          deleted: false,
        };
        updateData.unread = isSender ? 0 : (currentData.unread || 0) + 1;
        await update(chatRef, updateData);
      } catch (dbErr) {
        console.warn(`Could not update chats list for user: ${uid}.`, dbErr);
      }
    };
    await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName || profiles[activeThread.otherUserId]?.name || "User", true);
    await updateConv(activeThread.otherUserId, user.uid, dbUser?.name || user.displayName || "User", false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeThread || !user) return;
    setIsUploading(true);
    try {
      const urls = await uploadImages(Array.from(files));
      if (urls.length > 0) {
        const conversationId = activeThread.id;
        let initialStatus = "sent";
        try {
          const statusSnapshot = await get(ref(database, `status/${activeThread.otherUserId}`));
          if (statusSnapshot.val()?.state === "online") initialStatus = "delivered";
        } catch (err) {}
        try {
          const imagePayload: any = {
            senderId: user.uid,
            text: "📷 Image",
            imageUrl: urls[0],
            timestamp: serverTimestamp(),
            status: initialStatus,
          };
          if (activeListingId) imagePayload.listingId = activeListingId;
          if (replyingTo) {
            imagePayload.replyToId = replyingTo.id;
            imagePayload.replyToSender = replyingTo.senderName;
            imagePayload.replyToText = replyingTo.text;
          }
          await push(ref(database, `messages/${conversationId}`), imagePayload);
          setReplyingTo(null);
        } catch (dbErr) { console.error("Firebase write to messages failed:", dbErr); }

        const updateConv = async (uid: string, otherUid: string, otherName: string, isSender: boolean) => {
          try {
            const chatRef = ref(database, `users/${uid}/chats/${conversationId}`);
            const snapshot = await get(chatRef);
            const currentData = snapshot.val() || {};
            const updateData: any = {
              otherUserId: otherUid || "",
              otherUserName: otherName || "User",
              lastMessage: "📷 Image",
              timestamp: serverTimestamp(),
              deleted: false,
            };
            updateData.unread = isSender ? 0 : (currentData.unread || 0) + 1;
            await update(chatRef, updateData);
          } catch (dbErr) {
            console.warn(`Could not update chats list for user: ${uid}.`, dbErr);
          }
        };
        await updateConv(user.uid, activeThread.otherUserId, activeThread.otherUserName || profiles[activeThread.otherUserId]?.name || "User", true);
        await updateConv(activeThread.otherUserId, user.uid, dbUser?.name || user.displayName || "User", false);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  /* ================================================================
     Render
     ================================================================ */

  if (loading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main
      className="bg-surface-secondary md:static fixed left-0 right-0 overflow-hidden md:overflow-visible flex flex-col w-full md:w-full md:h-[calc(100vh-60px)]"
      style={isMobile ? {
        top: isMobileChatOpen ? "0px" : "56px",
        bottom: isMobileChatOpen ? "0px" : "58px",
        zIndex: isMobileChatOpen ? 55 : 40
      } : { height: "calc(100vh - 60px)" }}
    >
      <div className="grid max-w-full gap-0 md:gap-4 p-0 md:p-4 h-full md:grid-cols-[340px_1fr] w-full overflow-hidden md:overflow-visible">

        {/* ============================================================
            Thread Sidebar
            ============================================================ */}
        <aside className={`${isMobileChatOpen ? "hidden" : "flex"} md:flex flex-col md:rounded-2xl border-0 md:border border-border/10 bg-white shadow-soft overflow-hidden dark:bg-white/5`}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/10">
            <h1 className="text-xl font-black text-ink sm:text-2xl">Messages</h1>
            <span className="rounded-xl bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500 dark:bg-orange-500/10">
              {threads.length} chats
            </span>
          </div>

          <label className="mx-4 mt-4 mb-3 flex items-center gap-3 rounded-xl border border-border/10 bg-surface-secondary px-3 py-2.5 focus-within:border-orange-300 transition-smooth">
            <Search size={17} className="text-ink-tertiary shrink-0" />
            <input placeholder="Search conversations..." className="w-full border-0 bg-transparent p-0 text-sm font-semibold focus:ring-0 outline-none text-ink" />
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
              threads.map((thread) => {
                const pCount = getThreadProductCount(thread);
                const displayName = profiles[thread.otherUserId]?.name || thread.otherUserName;
                return (
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
                          alt={`${displayName}'s avatar`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        (displayName?.[0]?.toUpperCase() ?? "?")
                      )}
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block truncate font-bold text-ink text-sm">{displayName}</span>
                        {pCount > 1 && (
                          <span className="shrink-0 text-[10px] font-bold text-orange-500 bg-orange-50 rounded-full px-1.5 py-0.5 dark:bg-orange-500/10">
                            {pCount} 📚
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-ink-secondary">{thread.lastMessage}</span>
                    </span>
                    {thread.unread > 0 && (
                      <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-black text-white">
                        {thread.unread}
                      </span>
                    )}
                  </motion.button>
                );
              })
            )}
          </div>
        </aside>

        {/* ============================================================
            Chat Window
            ============================================================ */}
        <section className={`${isMobileChatOpen ? "flex" : "hidden"} md:flex flex-col overflow-hidden md:rounded-2xl border-0 md:border border-border/10 bg-white shadow-soft dark:bg-white/5`}>
          {activeThread ? (
            <>
              {/* ---- Header ---- */}
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
                        alt={`${profiles[activeThread.otherUserId]?.name || activeThread.otherUserName}'s avatar`}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-black text-lg shrink-0">
                        {((profiles[activeThread.otherUserId]?.name?.[0]?.toUpperCase()) ?? (activeThread.otherUserName?.[0]?.toUpperCase()) ?? "?")}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate font-bold text-ink text-sm sm:text-base leading-snug">
                        {profiles[activeThread.otherUserId]?.name || activeThread.otherUserName}
                      </h2>
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
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-surface-secondary transition-smooth text-ink-secondary"
                      aria-label="More"
                    >
                      <MoreVertical size={18} />
                    </button>
                    <AnimatePresence>
                      {showDropdown && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -5 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -5 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-11 z-50 w-40 rounded-xl bg-white p-1.5 shadow-lg border border-border/10 dark:bg-slate-800"
                        >
                          <button onClick={handleClearChat} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink hover:bg-orange-50 hover:text-orange-600 transition-smooth dark:hover:bg-orange-500/10">
                            Clear Chat
                          </button>
                          <button onClick={handleDeleteChat} className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-500 hover:bg-red-50 transition-smooth dark:hover:bg-red-500/10">
                            Delete Chat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </header>

              {/* ---- Product Context Card ---- */}
              {currentProduct && (
                <div className="border-b border-border/10 bg-orange-50 dark:bg-orange-500/5 relative" ref={productSwitcherRef}>
                  <div className="flex items-center gap-3 px-4 py-2.5">
                    {/* Thumbnail */}
                    {currentProduct.image && (
                      <img
                        src={currentProduct.image}
                        alt=""
                        className="h-10 w-10 rounded-lg object-cover border border-border/10 shrink-0"
                      />
                    )}
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold text-ink text-sm leading-snug">{currentProduct.title}</p>
                      {currentProduct.price > 0 && (
                        <p className="text-xs font-bold text-orange-500">₹{currentProduct.price.toLocaleString("en-IN")}</p>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/product/${currentProduct.id}`}
                        className="flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-bold text-orange-500 shadow-sm border border-border/10 hover:bg-orange-50 transition-smooth dark:bg-white/10 dark:hover:bg-white/15"
                      >
                        <ExternalLink size={11} />
                        View
                      </Link>
                      {productsCount > 1 && (
                        <button
                          onClick={() => setShowProductSwitcher(!showProductSwitcher)}
                          className="flex h-8 items-center gap-1 rounded-lg bg-white px-2.5 text-[11px] font-bold text-ink-secondary shadow-sm border border-border/10 hover:bg-surface-secondary transition-smooth dark:bg-white/10 dark:hover:bg-white/15"
                        >
                          <span className="text-orange-500">{productsCount}</span>
                          <ChevronDown size={13} className={`transition-transform duration-200 ${showProductSwitcher ? "rotate-180" : ""}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product Switcher Dropdown */}
                  <AnimatePresence>
                    {showProductSwitcher && productsCount > 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-orange-200/50 dark:border-orange-500/10"
                      >
                        <div className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
                          <p className="text-[10px] font-black text-ink-tertiary uppercase tracking-wider px-1 mb-1.5">Products discussed</p>
                          {Object.entries(threadProducts).map(([pid, p]) => (
                            <button
                              key={pid}
                              onClick={() => handleSwitchProduct(pid)}
                              className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-smooth ${
                                pid === activeListingId
                                  ? "bg-orange-100 dark:bg-orange-500/15 ring-1 ring-orange-300 dark:ring-orange-500/30"
                                  : "hover:bg-white dark:hover:bg-white/5"
                              }`}
                            >
                              {p.image ? (
                                <img src={p.image} alt="" className="h-8 w-8 rounded-md object-cover shrink-0 border border-border/10" />
                              ) : (
                                <div className="h-8 w-8 rounded-md bg-orange-100 flex items-center justify-center shrink-0 dark:bg-orange-500/10">
                                  <Tag size={12} className="text-orange-500" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-bold text-ink">{p.title}</p>
                                {p.price > 0 && <p className="text-[10px] font-bold text-orange-500">₹{p.price.toLocaleString("en-IN")}</p>}
                              </div>
                              {pid === activeListingId && (
                                <span className="h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* No product context fallback bar (legacy threads with no products) */}
              {!currentProduct && activeThread.productTitle && (
                <div className="border-b border-border/10 bg-orange-50 px-4 py-2.5 dark:bg-orange-500/5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="truncate font-bold text-ink text-sm">{activeThread.productTitle}</p>
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1 text-xs font-bold text-orange-500 shadow-soft dark:bg-white/10">
                      <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" /> Active
                    </span>
                  </div>
                </div>
              )}

              {/* ---- Deal Status / Contact Share Bar ---- */}
              {currentProduct && activeDeal && (
                <AnimatePresence mode="wait">
                  {activeDeal.state === "accepted" ? (
                    <motion.div
                      key="accepted"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="border-b border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 dark:border-emerald-500/20"
                    >
                      <div className="px-3 sm:px-4 py-2.5 flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial">
                          <span className="text-base shrink-0">🎉</span>
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 leading-tight">
                              Deal confirmed at ₹{activeDeal.currentOffer.toLocaleString("en-IN")}
                            </p>
                            <p className="text-[10px] font-medium text-emerald-700/70 dark:text-emerald-400/70">
                              You can now exchange contact details.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 sm:ml-auto w-full sm:w-auto">
                          <button
                            onClick={() => handleShareContact("whatsapp")}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1.5 text-[11px] font-black text-white shadow-soft hover:bg-[#20ba59] transition-smooth active:scale-95"
                          >
                            📱 WhatsApp
                          </button>
                          <button
                            onClick={() => handleShareContact("phone")}
                            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-black text-white shadow-soft hover:bg-slate-800 transition-smooth active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-white/90"
                          >
                            📞 Phone
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : activeDeal.state === "pending" ? (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="border-b border-orange-200/60 bg-orange-50/80 dark:bg-orange-500/5 dark:border-orange-500/20 px-4 py-2 flex items-center gap-2 text-[11px] font-bold text-orange-600 dark:text-orange-400"
                    >
                      <Lock size={11} />
                      Negotiating ₹{activeDeal.currentOffer.toLocaleString("en-IN")} — contact details unlock once accepted.
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              )}

              {/* Contact share / leak banner */}
              <AnimatePresence>
                {(leakWarning || contactBanner) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="border-b border-red-200/60 bg-red-50 dark:bg-red-500/10 dark:border-red-500/20 px-4 py-2 flex items-center gap-2 text-[11px] font-bold text-red-600 dark:text-red-400"
                  >
                    <Lock size={11} />
                    {leakWarning || contactBanner}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ---- Messages ---- */}
              <div className="flex-1 space-y-3 overflow-y-auto bg-[#f8f6f3] p-4 flex flex-col dark:bg-slate-900/50">
                <div className="flex justify-center mb-2">
                  <span className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-ink-tertiary border border-border/10 dark:bg-white/10">
                    Conversation started
                  </span>
                </div>
                {visibleMessages.length === 0 && (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm font-medium text-ink-tertiary">No messages here yet.</p>
                  </div>
                )}
                {visibleMessages.map((msg) => {
                  // System message
                  if (msg.isSystemMessage || msg.senderId === "system") {
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className="system-message rounded-lg bg-orange-50 px-4 py-1.5 text-[11px] font-semibold text-orange-600 border border-orange-100 dark:bg-orange-500/10 dark:border-orange-500/20 dark:text-orange-400 text-center max-w-[85%]">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  const mine = msg.senderId === user.uid;
                  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const msgProduct = msg.listingId && threadProducts[msg.listingId] ? threadProducts[msg.listingId] : null;

                  // ---- Offer / Counter offer card ----
                  if ((msg.kind === "offer" || msg.kind === "counter") && msg.offerAmount != null) {
                    const productForOffer = msg.listingId ? threadProducts[msg.listingId] : null;
                    const dealForMsg = msg.listingId ? deals[msg.listingId] : null;
                    // Show action buttons only on the most recent pending offer,
                    // and only to the recipient (not the offer-sender).
                    const isLatestPending =
                      dealForMsg?.state === "pending" &&
                      dealForMsg?.currentOffer === msg.offerAmount &&
                      dealForMsg?.currentOfferBy === msg.senderId;
                    const canAct = isLatestPending && !mine;
                    return (
                      <div key={msg.id} id={`msg-${msg.id}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] rounded-2xl border-2 p-4 shadow-soft ${
                          mine ? "bg-orange-500/95 text-white border-orange-400" : "bg-white text-ink border-orange-300 dark:bg-white/10"
                        }`}>
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider opacity-80 mb-2">
                            <HandCoins size={12} />
                            {msg.kind === "counter" ? "Counter Offer" : "Offer"}
                          </div>
                          {productForOffer && (
                            <p className={`text-[11px] font-semibold mb-2 truncate ${mine ? "text-white/80" : "text-ink-secondary"}`}>
                              📚 {productForOffer.title}
                              {productForOffer.price > 0 && (
                                <span className="ml-2 opacity-70">Listed: ₹{productForOffer.price.toLocaleString("en-IN")}</span>
                              )}
                            </p>
                          )}
                          <div className="flex items-baseline gap-1 mb-1">
                            <IndianRupee size={20} className="stroke-[2.5]" />
                            <span className="text-2xl font-black">{msg.offerAmount.toLocaleString("en-IN")}</span>
                          </div>
                          {dealForMsg?.state === "accepted" && (
                            <p className={`text-[11px] font-bold mt-1 ${mine ? "text-white" : "text-emerald-600"}`}>✓ Accepted</p>
                          )}
                          {dealForMsg?.state === "declined" && (
                            <p className={`text-[11px] font-bold mt-1 ${mine ? "text-white/80" : "text-red-500"}`}>✗ Declined</p>
                          )}
                          {dealForMsg?.state === "pending" && !isLatestPending && (
                            <p className={`text-[11px] font-medium mt-1 italic ${mine ? "text-white/70" : "text-ink-tertiary"}`}>Superseded by a newer offer</p>
                          )}
                          {dealForMsg?.state === "pending" && isLatestPending && mine && (
                            <p className={`text-[11px] font-medium mt-1 ${mine ? "text-white/80" : "text-ink-tertiary"}`}>Waiting for response…</p>
                          )}
                          {canAct && msg.listingId && (
                            <div className="mt-3 grid grid-cols-3 gap-1.5">
                              <button
                                onClick={() => handleAcceptOffer(msg.listingId!, msg.offerAmount!)}
                                className="flex items-center justify-center gap-1 rounded-lg bg-emerald-500 px-2 py-2 text-[11px] font-black text-white hover:bg-emerald-600 transition-smooth active:scale-95"
                              >
                                <CheckCircle2 size={12} /> Accept
                              </button>
                              <button
                                onClick={() => { openOfferModal(); }}
                                className="flex items-center justify-center gap-1 rounded-lg bg-white text-ink-secondary border border-border/20 px-2 py-2 text-[11px] font-black hover:bg-surface-secondary transition-smooth active:scale-95 dark:bg-slate-800 dark:hover:bg-slate-700"
                              >
                                <Repeat2 size={12} /> Counter
                              </button>
                              <button
                                onClick={() => handleDeclineOffer(msg.listingId!)}
                                className="flex items-center justify-center gap-1 rounded-lg bg-red-500/90 px-2 py-2 text-[11px] font-black text-white hover:bg-red-600 transition-smooth active:scale-95"
                              >
                                <XCircle size={12} /> Decline
                              </button>
                            </div>
                          )}
                          <span className={`mt-2 block text-right text-[10px] ${mine ? "text-white/70" : "text-ink-tertiary"}`}>
                            {time}
                          </span>
                        </div>
                      </div>
                    );
                  }

                  // ---- Acceptance / Decline notice ----
                  if (msg.kind === "accept" || msg.kind === "decline") {
                    const isAccept = msg.kind === "accept";
                    return (
                      <div key={msg.id} className="flex justify-center my-1.5">
                        <span className={`rounded-lg px-4 py-1.5 text-[11px] font-bold text-center max-w-[85%] border ${
                          isAccept
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400"
                        }`}>
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      id={`msg-${msg.id}`}
                      className={`flex items-end gap-1.5 group ${mine ? "justify-end" : "justify-start"}`}
                    >
                      {/* Action cluster (own messages — left side) */}
                      {mine && (
                        <div className="flex shrink-0 items-center gap-1 self-center">
                          <button
                            type="button"
                            onClick={() => setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                            aria-label="Add reaction"
                            title="Add reaction"
                          >
                            <Smile size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({ id: msg.id, senderName: "You", text: msg.text || "📷 Image" });
                              inputRef.current?.focus();
                            }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                            aria-label="Reply to message"
                            title="Reply to message"
                          >
                            <CornerUpLeft size={15} />
                          </button>
                        </div>
                      )}

                      {/* Bubble + reactions stack */}
                      <div className={`relative flex flex-col ${mine ? "items-end" : "items-start"} max-w-[78%] sm:max-w-[75%]`}>
                        {/* Reaction Picker */}
                        <AnimatePresence>
                          {reactionPickerFor === msg.id && (
                            <motion.div
                              ref={reactionPickerRef}
                              initial={{ opacity: 0, y: 8, scale: 0.92 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 8, scale: 0.92 }}
                              transition={{ duration: 0.16 }}
                              className={`absolute -top-12 z-30 flex items-center gap-0.5 rounded-full bg-white px-1.5 py-1 shadow-lg border border-border/10 dark:bg-slate-800 dark:border-white/10 ${
                                mine ? "right-0" : "left-0"
                              }`}
                            >
                              {REACTION_EMOJIS.map((emoji) => {
                                const reacted = !!msg.reactions?.[emoji]?.[user.uid];
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-transform hover:scale-125 active:scale-95 ${
                                      reacted ? "bg-orange-100 dark:bg-orange-500/20" : "hover:bg-surface-secondary dark:hover:bg-white/10"
                                    }`}
                                    aria-label={`React with ${emoji}`}
                                  >
                                    <span className="select-none">{emoji}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Message Bubble */}
                        <div className={`rounded-2xl px-3.5 py-2.5 sm:px-4 shadow-soft transition-all duration-300 ${
                          mine ? "bg-gradient-primary text-white rounded-bl-lg" : "bg-white text-ink border border-border/10 rounded-br-lg dark:bg-white/10"
                        }`}>
                          {/* Product context badge */}
                          {msgProduct && productsCount > 1 && (
                            <div className={`flex items-center gap-1 mb-1.5 text-[10px] font-bold ${mine ? "text-white/70" : "text-orange-500/80"}`}>
                              <Tag size={9} />
                              <span className="truncate">{msgProduct.title}</span>
                            </div>
                          )}

                          {/* Reply Quote */}
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
                            <img src={msg.imageUrl} alt="Chat attachment" className="max-w-full rounded-xl mb-1 object-contain max-h-60" />
                          )}
                          {msg.text && msg.text !== "📷 Image" && (
                            <p className="text-sm leading-relaxed break-words">{msg.text}</p>
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

                        {/* Reaction Pills */}
                        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
                            {Object.entries(msg.reactions).map(([emoji, users]) => {
                              const count = users ? Object.keys(users).length : 0;
                              if (count === 0) return null;
                              const reactedByMe = !!users[user.uid];
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold border transition-all active:scale-95 ${
                                    reactedByMe
                                      ? "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-500/20 dark:border-orange-500/40 dark:text-orange-300"
                                      : "bg-white border-border/15 text-ink-secondary hover:bg-surface-secondary dark:bg-slate-800 dark:border-white/10 dark:hover:bg-slate-700/60"
                                  }`}
                                  title={reactedByMe ? "Remove reaction" : "Add reaction"}
                                >
                                  <span className="text-sm leading-none">{emoji}</span>
                                  {count > 1 && <span>{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Action cluster (other user — right side) */}
                      {!mine && (
                        <div className="flex shrink-0 items-center gap-1 self-center">
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo({ id: msg.id, senderName: activeThread.otherUserName, text: msg.text || "📷 Image" });
                              inputRef.current?.focus();
                            }}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                            aria-label="Reply to message"
                            title="Reply to message"
                          >
                            <CornerUpLeft size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReactionPickerFor(reactionPickerFor === msg.id ? null : msg.id)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-ink-secondary opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 hover:text-orange-500 hover:bg-orange-50 shadow-sm border border-border/10 transition-all duration-200 active:scale-90 dark:bg-slate-800 dark:hover:bg-slate-700/50"
                            aria-label="Add reaction"
                            title="Add reaction"
                          >
                            <Smile size={15} />
                          </button>
                        </div>
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

              {/* ---- Reply Preview ---- */}
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

              {/* ---- Input ---- */}
              {profiles[activeThread.otherUserId]?.isDeleted ? (
                <div className="flex items-center justify-center border-t border-border/10 bg-red-50 px-4 py-4 dark:bg-red-500/10">
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">This user has been deleted and you cannot message them.</p>
                </div>
              ) : (
                <form
                  className="flex items-center gap-1.5 sm:gap-2 border-t border-border/10 bg-white px-2.5 py-2.5 sm:px-4 sm:py-3 dark:bg-white/5"
                  onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                >
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-ink-secondary hover:text-ink transition-smooth disabled:opacity-50" aria-label="Attach image">
                    <Paperclip size={18} />
                  </button>
                  {currentProduct && (!activeDeal || activeDeal.state !== "accepted") && (
                    <button
                      type="button"
                      onClick={openOfferModal}
                      title={isCurrentUserSeller ? "Send a counter offer" : "Make an offer"}
                      className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-orange-500 px-2.5 text-white hover:bg-orange-600 transition-smooth disabled:opacity-50"
                      aria-label="Make offer"
                    >
                      <HandCoins size={16} />
                      <span className="text-[11px] font-black hidden sm:inline">
                        {activeDeal?.state === "pending" && activeDeal.currentOfferBy === user.uid ? "Update" : activeDeal?.state === "pending" ? "Counter" : "Offer"}
                      </span>
                    </button>
                  )}
                  <input
                    ref={inputRef}
                    value={text}
                    onFocus={handleFocus}
                    onChange={handleTextInputChange}
                    placeholder={
                      isUploading
                        ? "Uploading image..."
                        : contactsUnlocked
                          ? "Type your message..."
                          : "Negotiate price — no phone numbers yet"
                    }
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
              )}
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

      {/* ============================================================
          Make / Counter Offer Modal
          ============================================================ */}
      <AnimatePresence>
        {showOfferModal && currentProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowOfferModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-900 border border-border/10"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shrink-0">
                    <HandCoins size={18} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-ink leading-snug">
                      {activeDeal?.state === "pending" ? "Send counter offer" : "Make an offer"}
                    </h3>
                    <p className="text-[11px] font-medium text-ink-secondary truncate">📚 {currentProduct.title}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-secondary transition-smooth"
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              {currentProduct.price > 0 && (
                <div className="rounded-xl bg-surface-secondary px-3 py-2 mb-3 flex items-center justify-between text-[11px] font-bold dark:bg-white/5">
                  <span className="text-ink-secondary">Listed price</span>
                  <span className="text-ink">₹{currentProduct.price.toLocaleString("en-IN")}</span>
                </div>
              )}

              {activeDeal?.state === "pending" && (
                <div className="rounded-xl bg-orange-50 px-3 py-2 mb-3 flex items-center justify-between text-[11px] font-bold dark:bg-orange-500/10">
                  <span className="text-orange-700 dark:text-orange-400">Current offer</span>
                  <span className="text-orange-700 dark:text-orange-400">₹{activeDeal.currentOffer.toLocaleString("en-IN")}</span>
                </div>
              )}

              <label className="block text-[11px] font-black uppercase tracking-wider text-ink-tertiary mb-1.5">Your offer (₹)</label>
              <div className="flex items-center gap-2 rounded-xl border-2 border-orange-300 bg-white px-3 py-2.5 focus-within:border-orange-500 transition-smooth dark:bg-slate-800 dark:border-orange-500/40">
                <IndianRupee size={18} className="text-orange-500 shrink-0" />
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  autoFocus
                  value={offerInput}
                  onChange={(e) => { setOfferInput(e.target.value); setOfferError(null); }}
                  placeholder="Enter amount"
                  className="flex-1 border-0 bg-transparent p-0 text-base font-black focus:ring-0 outline-none text-ink"
                />
              </div>
              {offerError && (
                <p className="mt-2 text-[11px] font-bold text-red-500">{offerError}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="flex-1 rounded-xl bg-surface-secondary py-2.5 text-xs font-black text-ink hover:bg-surface-tertiary transition-smooth dark:bg-white/5 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const amt = parseInt(offerInput, 10);
                    if (!Number.isFinite(amt) || amt <= 0) {
                      setOfferError("Enter a valid amount.");
                      return;
                    }
                    handleSendOffer(amt);
                  }}
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 text-xs font-black text-white hover:bg-orange-600 transition-smooth active:scale-[0.98]"
                >
                  {activeDeal?.state === "pending" ? "Send Counter" : "Send Offer"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
