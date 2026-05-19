"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f3] text-ink dark:bg-slate-950 pb-nav relative overflow-hidden">
      {/* Decorative dynamic glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[120px] dark:bg-orange-500/10" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-16 space-y-8 sm:space-y-10">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold sm:font-black text-ink-secondary hover:text-orange-500 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Marketplace
        </Link>

        {/* Header Block */}
        <div className="space-y-3 sm:space-y-4">
          <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <CheckCircle2 size={24} className="sm:size-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight animate-fade-in">About SellChey</h1>
          <p className="text-xs sm:text-sm font-bold text-ink-secondary">Last updated: May 19, 2026</p>
          <p className="text-sm sm:text-base font-semibold leading-relaxed text-ink-secondary">
            SellChey is India's first specialized student-to-student marketplace designed exclusively for buying and selling used college preparation books. We connect students across Engineering (IPE), Medical (NEET), and other competitive exams.
          </p>
        </div>

        {/* Core Content */}
        <div className="space-y-4 sm:space-y-6 pt-4">
          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl sm:rounded-3xl border border-border/10 bg-white dark:bg-slate-900/60 p-4 sm:p-6 lg:p-8 shadow-soft space-y-3 sm:space-y-4"
          >
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-ink">Our Mission</h2>
            <p className="text-xs sm:text-sm lg:text-base font-semibold text-ink-secondary leading-relaxed">
              We believe quality exam prep books shouldn't be expensive. SellChey makes it easy for students to extend the life of books, reduce costs, and support each other in their academic journey — all within a trusted, localized campus community.
            </p>
          </motion.div>

          {/* Values */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl sm:rounded-3xl border border-border/10 bg-white dark:bg-slate-900/60 p-4 sm:p-6 lg:p-8 shadow-soft space-y-3 sm:space-y-4"
          >
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-ink">Our Values</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-orange-500/10 p-3">
                <p className="font-bold text-sm text-orange-600">Student-First</p>
                <p className="text-xs text-ink-secondary">Built by students, for students</p>
              </div>
              <div className="rounded-lg bg-blue-500/10 p-3">
                <p className="font-bold text-sm text-blue-600">Fast & Easy</p>
                <p className="text-xs text-ink-secondary">Post listings in a minute</p>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <p className="font-bold text-sm text-emerald-600">Safe & Trusted</p>
                <p className="text-xs text-ink-secondary">Secure peer-to-peer</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3">
                <p className="font-bold text-sm text-purple-600">Focused</p>
                <p className="text-xs text-ink-secondary">Specialized for exam prep</p>
              </div>
            </div>
          </motion.div>

          {/* Why Choose */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl sm:rounded-3xl border border-border/10 bg-white dark:bg-slate-900/60 p-4 sm:p-6 lg:p-8 shadow-soft space-y-3 sm:space-y-4"
          >
            <h2 className="text-base sm:text-lg lg:text-xl font-black text-ink">Why Choose SellChey?</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-ink-secondary">100% Free — No hidden charges</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-ink-secondary">Campus-Safe meetups</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-ink-secondary">Direct WhatsApp chat with sellers</span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                <span className="font-semibold text-ink-secondary">IPE, EAPCET, JEE, NEET focused</span>
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </main>
  );
}