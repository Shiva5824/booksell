"use client";

import React from "react";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Lock, Eye, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Information We Collect",
      icon: Eye,
      content: "We collect information you provide directly to us when creating an account, completing your onboarding, or posting a listing. This includes your name, email address, campus location/college, phone number, and any listing photographs or descriptions you choose to publish."
    },
    {
      title: "2. How We Use Your Information",
      icon: FileText,
      content: "We use the collected information to power the SellChey peer-to-peer marketplace. Specifically, we display your chosen campus/college so buyers can filter listings local to them, and we display your phone number via a quick WhatsApp contact button so buyers can directly message you to coordinate a safe meetup."
    },
    {
      title: "3. Information Sharing and Safety",
      icon: Shield,
      content: "SellChey is a student-to-student marketplace. Your listings, campus location, and contact information are public to logged-in users on the platform. We do not sell your personal data to third parties. We strongly advise completing all transactions in safe, public, daytime campus settings."
    },
    {
      title: "4. Data Security and Retention",
      icon: Lock,
      content: "Your credentials are securely authenticated using Google Firebase, and your profile records are stored securely in our databases. You can edit your profile information or delete your listings at any time. For complete account deletion, you may reach out to an administrator."
    }
  ];

  return (
    <main className="min-h-screen bg-[#f8f6f3] text-ink dark:bg-slate-950 pb-nav relative overflow-hidden">
      {/* Decorative dynamic glows */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -top-1/4 -right-1/4 w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[120px] dark:bg-orange-500/10" />
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-16 space-y-10">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-black text-ink-secondary hover:text-orange-500 transition-colors group"
        >
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
          Back to Marketplace
        </Link>

        {/* Header Block */}
        <div className="space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <Shield size={28} />
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl animate-fade-in">Privacy Policy</h1>
          <p className="text-sm font-bold text-ink-secondary">Last updated: May 18, 2026</p>
          <p className="text-base font-semibold leading-relaxed text-ink-secondary">
            At SellChey, we are committed to protecting your privacy and providing a safe, trusted campus marketplace. 
            This policy outlines how we handle your personal details.
          </p>
        </div>

        {/* Core Sections */}
        <div className="space-y-6 pt-4">
          {sections.map((section, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-3xl border border-border/10 bg-white dark:bg-slate-900/60 p-6 sm:p-8 shadow-soft space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <section.icon size={20} />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-ink">{section.title}</h2>
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-ink-secondary">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Extra disclaimer */}
        <div className="rounded-3xl border border-dashed border-border/20 bg-white/40 dark:bg-slate-900/20 p-6 text-center space-y-3">
          <CheckCircle2 className="mx-auto text-emerald-500" size={32} />
          <h3 className="text-lg font-black">Trusted Peer-to-Peer Safety</h3>
          <p className="max-w-md mx-auto text-xs font-semibold leading-relaxed text-ink-secondary sm:text-sm">
            SellChey is built by students, for students. We secure your credentials via Firebase Auth and never engage in automated third-party data tracking.
          </p>
        </div>
      </div>
    </main>
  );
}
