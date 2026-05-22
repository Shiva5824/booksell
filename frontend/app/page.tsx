"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, BookOpen, Cpu, FlaskConical,
  MapPin, PackageOpen, Plus, Search, 
  Stethoscope, TrendingUp, UsersRound, Mail, MessageCircle, X, CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import SearchBar from "@/components/SearchBar";
import HeroCarousel from "@/components/HeroCarousel";
import { getProducts } from "@/services/api";
import { getSiteContact } from "@/services/site";
import type { Product, ProductFilters } from "@/lib/types";

const staggerContainer: any = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp: any = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

const mainCategories = [
  { label: "JEE", icon: Cpu, category: "jee" as const, description: "Engineering Prep" },
  { label: "NEET", icon: Stethoscope, category: "neet" as const, description: "Medical Prep" },
  { label: "EAPCET", icon: FlaskConical, category: "eapcet" as const, description: "State Eng & Med" },
  { label: "IPE", icon: BookOpen, category: "ipe" as const, description: "State Board Exams" }
];

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[28px] bg-white shadow-soft dark:bg-white/10">
      <div className="aspect-[4/3] skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-5 rounded-full w-3/4" />
        <div className="skeleton h-4 rounded-full w-1/2" />
        <div className="flex gap-2">
          <div className="skeleton h-6 rounded-full w-20" />
          <div className="skeleton h-6 rounded-full w-28" />
        </div>
        <div className="skeleton h-9 rounded-full w-full mt-2" />
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="rounded-[28px] bg-white p-4 shadow-soft dark:bg-white/10 sm:p-5">
      <div className="skeleton h-4 rounded-full w-2/3 mb-3" />
      <div className="skeleton h-9 rounded-full w-1/2" />
    </div>
  );
}

export default function HomePage() {
  const [filters, setFilters] = useState<ProductFilters>({ sort: "newest" });
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [visibleCount, setVisibleCount] = useState(6);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [contactDetails, setContactDetails] = useState({ supportEmail: "", whatsappNumber: "" });
  const [loadingContact, setLoadingContact] = useState(false);

  const faqs = [
    {
      q: "What is SellChey?",
      a: "SellChey is a fast, trusted, and localized student-to-student marketplace designed specifically for buying and selling used college preparation books (such as IPE, EAPCET, JEE, and NEET) and other campus essentials."
    },
    {
      q: "How do I buy a book or listing?",
      a: "Simply browse or search for the item you need, click on the listing, and use the direct WhatsApp link to chat with the seller. You can arrange a safe campus meetup to inspect the book and complete the purchase."
    },
    {
      q: "How can I post a listing?",
      a: "Click on 'Sell Your Item' or the 'Post' button, log in securely with your account, fill in your book's details (such as price, condition, category, and college), upload a photo, and publish! It takes less than a minute."
    },
    {
      q: "Is SellChey free to use?",
      a: "Yes! SellChey is 100% free for all campus students. We do not charge listing fees, transaction costs, or commissions. Every transaction happens directly between the buyer and the seller."
    },
    {
      q: "How do I ensure safety during meetups?",
      a: "Always arrange to meet sellers in public, well-lit campus spaces (like libraries, main gates, or student lounges) during daylight hours, and fully inspect the books before making any payments."
    }
  ];

  useEffect(() => {
    setLoadingProducts(true);
    getProducts(filters).then((data) => {
      setProducts(data);
      setLoadingProducts(false);
    });
  }, [filters]);

  const visibleProducts = useMemo(() => products.slice(0, visibleCount), [products, visibleCount]);
  const ipeCount = useMemo(() => products.filter((p) => p.category === "ipe").length, [products]);
  const eapcetCount = useMemo(() => products.filter((p) => p.category === "eapcet").length, [products]);
  const jeeCount = useMemo(() => products.filter((p) => p.category === "jee").length, [products]);
  const neetCount = useMemo(() => products.filter((p) => p.category === "neet").length, [products]);
  const colleges = useMemo(() => Array.from(new Set(products.map((p) => p.college))).slice(0, 4), [products]);

  function applyCategory(category: ProductFilters["category"]) {
    setVisibleCount(6);
    setFilters({ ...filters, category, sort: filters.sort || "newest" });
    document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function openContact() {
    setShowContact(true);
    setLoadingContact(true);
    try {
      const data = await getSiteContact();
      setContactDetails(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContact(false);
    }
  }

  const stats = [
    { label: "IPE Books", value: ipeCount, icon: BookOpen },
    { label: "EAPCET Books", value: eapcetCount, icon: FlaskConical },
    { label: "JEE Books", value: jeeCount, icon: Cpu },
    { label: "NEET Books", value: neetCount, icon: Stethoscope },
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f3] text-ink dark:bg-slate-950 pb-nav">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-7">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.28em] text-orange-500 sm:text-sm">
              <TrendingUp size={16} />
              Student Marketplace
            </motion.div>

            <motion.div variants={fadeUp} className="space-y-5">
              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                Buy &amp; Sell
                <br />
                Used College
                <br />
                Essentials
              </h1>
              <p className="max-w-xl text-base font-medium leading-relaxed text-ink-secondary sm:text-lg">
                Find affordable IPE, EAPCET, JEE, and NEET preparation books from students around your college.
              </p>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <a href="#listings" className="btn-primary px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base">
                <Search size={19} />
                Explore Listings
              </a>
              <Link href="/post" className="btn-secondary px-6 py-3.5 text-sm sm:px-8 sm:py-4 sm:text-base">
                <Plus size={19} />
                Sell Your Item
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid max-w-2xl grid-cols-2 gap-3 pt-1 sm:grid-cols-4 sm:gap-4">
              {loadingProducts
                ? [1, 2, 3, 4].map((i) => <StatSkeleton key={i} />)
                : stats.map((stat) => (
                  <div key={stat.label} className="rounded-[24px] bg-white p-4 shadow-soft dark:bg-white/10">
                    <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-ink-secondary">
                      <stat.icon size={15} className="text-orange-500" />
                      <span className="truncate">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black sm:text-3xl">{stat.value}</p>
                  </div>
                ))}
            </motion.div>
          </motion.div>

          {/* Hero image — carousel component */}
          <HeroCarousel />
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">Shop by need</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl">Popular Categories</h2>
          </div>
          <button onClick={() => applyCategory("")} className="text-sm font-black text-orange-500 hover:underline">
            View All
          </button>
        </div>

        {/* Category List */}
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide sm:grid sm:grid-cols-4 sm:gap-6">
          {mainCategories.map(({ label, icon: Icon, category, description }) => (
            <button
              key={label}
              onClick={() => applyCategory(category)}
              className="group flex-none w-32 sm:w-auto rounded-[24px] border border-border/10 bg-white p-4 sm:p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-orange-100 hover:bg-orange-50 hover:shadow-soft-lg dark:bg-white/5 dark:hover:bg-orange-500/10"
            >
              <span className="mx-auto mb-3 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-[#f8f6f3] text-orange-500 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:bg-white/10">
                <Icon size={20} className="sm:size-22" />
              </span>
              <span className="block text-sm font-black sm:text-base">{label}</span>
              <span className="mt-1 block text-[10px] sm:text-xs font-semibold text-ink-secondary">{description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Listings ── */}
      <section id="listings" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <SearchBar
          filters={filters}
          resultCount={products.length}
          onChange={(nextFilters) => {
            setVisibleCount(6);
            setFilters(nextFilters);
          }}
        />

        <div className="mb-7 mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">Live marketplace</p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight sm:text-3xl sm:text-4xl">Trending Listings</h2>
            <p className="mt-1.5 text-sm font-medium text-ink-secondary sm:text-base">
              Sorted by{" "}
              {filters.sort === "price_asc" ? "lowest price" : filters.sort === "price_desc" ? "highest price" : "newest arrivals"}.
            </p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-black shadow-soft dark:bg-white/10">
            <PackageOpen size={16} className="text-orange-500" />
            {products.length} items available
          </div>
        </div>

        {loadingProducts ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:gap-7">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : visibleProducts.length ? (
          <>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 xl:gap-7"
            >
              {visibleProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </motion.div>

            {visibleProducts.length < products.length && (
              <div className="flex justify-center pt-10">
                <button onClick={() => setVisibleCount((c) => c + 6)} className="btn-secondary px-8 py-4">
                  Load More Listings
                </button>
              </div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid min-h-[320px] place-items-center rounded-[34px] border border-dashed border-border/20 bg-white p-8 text-center shadow-soft dark:bg-white/10"
          >
            <div className="mx-auto max-w-md space-y-5">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-500 dark:bg-orange-500/15">
                <PackageOpen size={38} />
              </div>
              <div>
                <h3 className="text-2xl font-black">No Listings Found</h3>
                <p className="mt-3 text-sm text-ink-secondary sm:text-base">
                  Try adjusting your filters or check back later when students post new items.
                </p>
              </div>
              <button onClick={() => setFilters({ sort: "newest" })} className="btn-primary mt-4">
                Clear All Filters
              </button>
            </div>
          </motion.div>
        )}
      </section>

      {/* ── FAQ Section ── */}
      <section id="faq" className="border-y border-border/10 bg-white/55 py-14 dark:bg-white/5">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center space-y-3 mb-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-500 sm:text-sm">Got Questions?</p>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Frequently Asked Questions</h2>
            <p className="max-w-xl mx-auto text-sm font-medium text-ink-secondary leading-relaxed">
              Everything you need to know about buying, selling, and staying safe on SellChey.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = activeFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-3xl border border-border/10 bg-white dark:bg-slate-900/60 overflow-hidden shadow-soft transition-all duration-300 focus-within:border-orange-500/30"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left font-black text-ink hover:text-orange-500 transition-colors focus:outline-none"
                  >
                    <span className="text-base sm:text-lg">{faq.q}</span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                      ↓
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 text-sm sm:text-base font-semibold leading-relaxed text-ink-secondary border-t border-border/5 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="relative overflow-hidden rounded-[30px] bg-slate-900 p-7 text-white shadow-soft-lg sm:p-10 lg:p-14">
          <div className="relative z-10 grid items-center gap-8 md:grid-cols-[1fr_340px]">
            <div className="max-w-2xl">
              <p className="mb-3 text-xs font-black uppercase tracking-[0.28em] text-orange-400 sm:text-sm">Student Deals</p>
              <h2 className="text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Save More on<br />College Essentials
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-300 sm:text-lg">
                Buy affordable second-hand prep books from students near you and save on your preparation.
              </p>
              <a
                href="#listings"
                className="mt-7 inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3.5 font-black text-white transition-colors hover:bg-orange-600 sm:px-8 sm:py-4"
              >
                Start Browsing
                <ArrowRight size={18} />
              </a>
            </div>
            <img
              src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1400&auto=format&fit=crop"
              alt="Stack of books"
              className="hidden h-[280px] w-full rounded-[24px] object-cover shadow-2xl md:block lg:h-[360px]"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/10 bg-white dark:bg-slate-950 pb-nav sm:pb-0">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 grid-cols-4 lg:grid-cols-4">
          <div>
            <h3 className="text-sm sm:text-xl font-black">
              Sell<span className="text-orange-500">Chey</span>
            </h3>
            <p className="mt-2 text-[10px] sm:text-sm leading-tight text-ink-secondary hidden sm:block">
              India's student marketplace for Engineering and Medical prep books.
            </p>
          </div>
          <div>
            <button
              onClick={() => document.getElementById("listings")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="mb-2 block font-black hover:text-orange-500 transition-colors text-[10px] sm:text-base text-left"
            >
              Market
            </button>
            <ul className="space-y-1 text-[10px] sm:text-sm text-ink-secondary">
              {(["ipe", "eapcet", "jee", "neet"] as const).map((cat) => (
                <li key={cat}>
                  <button onClick={() => applyCategory(cat)} className="hover:text-orange-500 transition-colors uppercase font-semibold text-[9px] sm:text-xs tracking-wider">
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-black text-[10px] sm:text-base">Links</h4>
            <ul className="space-y-1 text-[10px] sm:text-sm text-ink-secondary">
              <li>
                <Link href="/about" className="hover:text-orange-500 transition-colors cursor-pointer text-left block">
                  About
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:text-orange-500 transition-colors cursor-pointer text-left block"
                >
                  Help
                </button>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-500 transition-colors cursor-pointer text-left block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button onClick={() => openContact()} className="hover:text-orange-500 transition-colors cursor-pointer text-left block">
                  Contact
                </button>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 font-black text-[10px] sm:text-base">Post</h4>
            <Link href="/post" className="btn-primary p-2 text-[10px] sm:text-sm sm:p-3">
              <Plus size={12} className="sm:size-4" />
              <span className="hidden sm:inline">Listing</span>
            </Link>
          </div>
        </div>
        <div className="border-t border-border/10 py-5 text-center text-xs text-ink-tertiary sm:text-sm">
          © 2026 SellChey. All rights reserved.
        </div>
      </footer>

      <AnimatePresence>
        {showContact && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowContact(false)} />
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-black">Get in Touch</h2>
                <button onClick={() => setShowContact(false)} className="p-1 hover:bg-surface-tertiary rounded-lg transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-ink-secondary mb-6">Reach out to us via email or WhatsApp.</p>
              
              {loadingContact ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {contactDetails.supportEmail && (
                    <a 
                      href={`mailto:${contactDetails.supportEmail}`}
                      className="flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-border/10 bg-blue-500/10 p-4 sm:p-6 hover:bg-blue-500/20 transition-colors active:scale-95"
                    >
                      <Mail size={28} className="sm:size-8 text-blue-500" />
                      <span className="text-xs sm:text-sm font-bold text-ink text-center">Email</span>
                    </a>
                  )}

                  {contactDetails.whatsappNumber && (
                    <a 
                      target="_blank" 
                      rel="noreferrer" 
                      href={`https://wa.me/91${contactDetails.whatsappNumber}`}
                      className="flex flex-col items-center justify-center gap-2 sm:gap-3 rounded-2xl border border-border/10 bg-emerald-500/10 p-4 sm:p-6 hover:bg-emerald-500/20 transition-colors active:scale-95"
                    >
                      <MessageCircle size={28} className="sm:size-8 text-emerald-500" />
                      <span className="text-xs sm:text-sm font-bold text-ink text-center">WhatsApp</span>
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


    </main>
  );
}
