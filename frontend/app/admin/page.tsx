"use client";
import React, { useEffect, useState } from "react";
import { getAdminStats } from "@/services/api";
import { getSiteContact, updateSiteContact } from "@/services/site";
import { Users, ShoppingBag, CheckCircle2, TrendingUp, Calendar, ArrowUpRight, Edit2, Trash2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({ supportEmail: "", whatsappNumber: "" });
  const [savingContact, setSavingContact] = useState(false);
  const [contactMsg, setContactMsg] = useState("");
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [hasContact, setHasContact] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getAdminStats();
        setStats(data);
        try {
          const site = await getSiteContact();
          setContactForm({ supportEmail: site.supportEmail || "", whatsappNumber: site.whatsappNumber || "" });
          setHasContact(!!(site.supportEmail || site.whatsappNumber));
          setIsEditingContact(false);
        } catch (e) {
          console.error("Failed loading site contact", e);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  async function handleContactSave(e: any) {
    e.preventDefault();
    setSavingContact(true);
    setContactMsg("");
    try {
      const payload = { supportEmail: contactForm.supportEmail.trim(), whatsappNumber: (contactForm.whatsappNumber || "").replace(/\D/g, "") };
      await updateSiteContact(payload);
      setContactMsg("Saved successfully");
      setHasContact(!!(payload.supportEmail || payload.whatsappNumber));
      setIsEditingContact(false);
      setTimeout(() => setContactMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setContactMsg("Save failed");
    } finally {
      setSavingContact(false);
    }
  }

  async function handleDeleteContact() {
    setSavingContact(true);
    try {
      await updateSiteContact({ supportEmail: "", whatsappNumber: "" });
      setContactForm({ supportEmail: "", whatsappNumber: "" });
      setHasContact(false);
      setIsEditingContact(false);
      setContactMsg("Deleted successfully");
      setTimeout(() => setContactMsg(""), 2000);
    } catch (err) {
      console.error(err);
      setContactMsg("Delete failed");
    } finally {
      setSavingContact(false);
    }
  }

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "bg-blue-500", trend: "+12% this month" },
    { label: "Total Listings", value: stats?.totalProducts || 0, icon: ShoppingBag, color: "bg-orange-500", trend: "+8% this week" },
    { label: "Active Listings", value: stats?.activeProducts || 0, icon: CheckCircle2, color: "bg-emerald-500", trend: "92% availability" },
    { label: "Logins Today", value: stats?.loginsToday || 0, icon: Calendar, color: "bg-purple-500", trend: "Peak at 4:00 PM" },
  ];

  const [timeframe, setTimeframe] = useState("7 days");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-10 w-48 rounded-lg bg-surface-tertiary" />
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-3xl bg-surface-tertiary" />)}
    </div>
  </div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-ink">Dashboard Overview</h1>
        <p className="mt-2 font-medium text-ink-secondary text-sm">Platform performance and real-time statistics.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-border/10 bg-surface-bg p-6 shadow-card hover:shadow-soft-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.color} text-white shadow-lg`}>
                <card.icon size={24} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-500">
                <ArrowUpRight size={12} />
                {card.trend}
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-bold text-ink-secondary">{card.label}</p>
              <p className="text-3xl font-black text-ink mt-1">{card.value}</p>
            </div>
            
            {/* Background pattern */}
            <div className="absolute -bottom-6 -right-6 h-24 w-24 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <card.icon size={96} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-border/10 bg-surface-bg p-6 shadow-card">
        <h3 className="text-lg font-black text-ink mb-4">Site Contact Settings</h3>
        
        {!hasContact && !isEditingContact ? (
          <div className="text-center py-8">
            <Plus size={48} className="mx-auto mb-4 text-ink-secondary opacity-50" />
            <p className="text-sm text-ink-secondary mb-4">No contact details set yet.</p>
            <button
              onClick={() => setIsEditingContact(true)}
              className="btn-primary px-4 py-2"
            >
              Add Contact Details
            </button>
          </div>
        ) : hasContact && !isEditingContact ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-secondary p-4">
              <p className="text-xs font-bold text-ink-secondary mb-1">Support Email</p>
              <p className="text-sm font-bold text-ink">{contactForm.supportEmail}</p>
            </div>
            <div className="rounded-lg bg-surface-secondary p-4">
              <p className="text-xs font-bold text-ink-secondary mb-1">WhatsApp Number</p>
              <p className="text-sm font-bold text-ink">+91 {contactForm.whatsappNumber}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditingContact(true)}
                className="flex items-center gap-2 flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 px-4 py-2 rounded-lg font-bold transition-colors"
              >
                <Edit2 size={16} />
                Edit
              </button>
              <button
                onClick={handleDeleteContact}
                disabled={savingContact}
                className="flex items-center gap-2 flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 px-4 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
              >
                <Trash2 size={16} />
                {savingContact ? "Deleting..." : "Delete"}
              </button>
            </div>

            {contactMsg && (
              <div className={`text-sm p-2 rounded text-center ${contactMsg.includes("successfully") ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                {contactMsg}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleContactSave} className="space-y-3 max-w-md">
            <div>
              <label className="block text-sm font-bold mb-1">Support Email</label>
              <input 
                type="email" 
                value={contactForm.supportEmail} 
                onChange={(e) => setContactForm({ ...contactForm, supportEmail: e.target.value })} 
                className="w-full rounded-lg border border-border/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">WhatsApp Number (without +91)</label>
              <input 
                type="text" 
                value={contactForm.whatsappNumber} 
                onChange={(e) => setContactForm({ ...contactForm, whatsappNumber: e.target.value.replace(/\D/g, "") })} 
                className="w-full rounded-lg border border-border/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary" 
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={savingContact} className="btn-primary px-4 py-2">
                {savingContact ? "Saving..." : "Save"}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  setIsEditingContact(false);
                  setContactMsg("");
                }} 
                className="px-4 py-2 rounded-lg bg-surface-tertiary font-bold hover:bg-surface-glass transition-colors"
              >
                Cancel
              </button>
            </div>

            {contactMsg && (
              <div className={`text-sm p-2 rounded text-center ${contactMsg.includes("successfully") ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
                {contactMsg}
              </div>
            )}
          </form>
        )}
      </div>

      {/* Basic Traffic Chart Mockup */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="col-span-1 lg:col-span-2 rounded-3xl border border-border/10 bg-surface-bg p-8 shadow-card overflow-visible">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-ink">Login Traffic</h3>
              <p className="text-sm font-medium text-ink-secondary">Daily user activity over the last {timeframe}.</p>
            </div>
            
            {/* Custom Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 rounded-xl border border-border/10 bg-surface-secondary px-4 py-2 text-xs font-black text-ink hover:bg-surface-tertiary transition-all"
              >
                Last {timeframe}
                <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
                  <TrendingUp size={14} className="text-primary" />
                </motion.div>
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-40 z-20 overflow-hidden rounded-2xl border border-border/10 bg-surface-bg p-1.5 shadow-soft-lg"
                    >
                      {["7 days", "30 days"].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTimeframe(option);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full rounded-xl px-4 py-2.5 text-left text-xs font-bold transition-all ${
                            timeframe === option 
                              ? "bg-primary text-white" 
                              : "text-ink-secondary hover:bg-surface-tertiary hover:text-ink"
                          }`}
                        >
                          Last {option}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          <div className="flex h-64 items-end gap-3 px-4">
            {[45, 62, 58, 75, 90, 82, 110].map((val, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-3">
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 1 }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-primary to-orange-400 opacity-80 hover:opacity-100 transition-opacity" 
                />
                <span className="text-[10px] font-black uppercase text-ink-tertiary">Day {i+1}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border/10 bg-surface-bg p-8 shadow-card">
          <h3 className="text-lg font-black text-ink mb-6">User Distribution</h3>
          <div className="space-y-6">
            {[
              { label: "Engineering (IPE)", value: 45, color: "bg-orange-500" },
              { label: "Medical (NEET)", value: 30, color: "bg-blue-500" },
              { label: "EAPCET/JEE", value: 25, color: "bg-emerald-500" },
            ].map(item => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-ink">{item.label}</span>
                  <span className="text-ink-secondary">{item.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-tertiary overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    className={`h-full rounded-full ${item.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-10 rounded-2xl bg-surface-tertiary p-5">
            <div className="flex items-center gap-3 text-primary mb-2">
              <TrendingUp size={18} />
              <span className="text-sm font-black">Growth Insights</span>
            </div>
            <p className="text-xs font-medium text-ink-secondary leading-relaxed">
              Medical books are seeing a 20% spike in listings this week. Consider promoting NEET prep materials on the homepage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
