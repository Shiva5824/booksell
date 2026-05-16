"use client";
import React, { useEffect, useState } from "react";
import { getAdminUsers, toggleUserActive, toggleUserRole } from "@/services/api";
import { Search, Shield, UserX, UserCheck, Mail, Calendar, MapPin, ShieldOff, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthProvider";

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ msg: string; type: "error" | "success" } | null>(null);

  const { dbUser: currentUser } = useAuth();

  const showNotification = (msg: string, type: "error" | "success" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(id: string) {
    try {
      const updatedUser = await toggleUserActive(id);
      setUsers(users.map(u => u._id === id ? updatedUser : u));
      showNotification(`User account ${updatedUser.isActive ? "enabled" : "disabled"} successfully.`);
    } catch (err) {
      showNotification("Failed to update user status", "error");
    }
  }

  async function handleRoleToggle(id: string) {
    const userToUpdate = users.find(u => u._id === id);
    if (userToUpdate?.firebaseUid === currentUser?.firebaseUid) {
      showNotification("You cannot revoke your own admin privileges.", "error");
      return;
    }

    const confirmMsg = userToUpdate?.role === "admin" 
      ? `Remove ${userToUpdate.name} as admin?`
      : `Make ${userToUpdate.name} an admin?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const updatedUser = await toggleUserRole(id);
      setUsers(users.map(u => u._id === id ? updatedUser : u));
      showNotification(`User role updated to ${updatedUser.role}.`);
    } catch (err) {
      showNotification("Failed to update user role", "error");
    }
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      {/* Minimal Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-6 left-1/2 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-soft-lg backdrop-blur-md ${
              notification.type === "error" 
                ? "bg-red-500/90 text-white" 
                : "bg-slate-900/90 text-white"
            }`}
          >
            {notification.type === "error" ? <ShieldAlert size={18} /> : <Shield size={18} />}
            <span className="text-sm font-bold tracking-tight">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-ink">User Management</h1>
          <p className="mt-2 font-medium text-ink-secondary text-sm">Control user access and view detailed account information.</p>
        </div>
        
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-2xl border border-border/10 bg-surface-bg py-3 pl-12 pr-4 text-sm font-semibold text-ink outline-none focus:border-primary/50 transition-all shadow-card"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[32px] border border-border/10 bg-surface-bg shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-tertiary/50">
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">User</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">College</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Joined</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Last Login</th>
                <th className="px-6 py-5 text-xs font-black uppercase tracking-wider text-ink-secondary">Status</th>
                <th className="px-6 py-5 text-right text-xs font-black uppercase tracking-wider text-ink-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/5">
              <AnimatePresence>
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-surface-glass transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-border/10 bg-surface-tertiary">
                          {user.avatar ? (
                            <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center font-bold text-ink-tertiary">
                              {user.name[0]}
                            </div>
                          )}
                          {user.role === "admin" && (
                            <div className="absolute -right-1 -top-1 rounded-full bg-primary p-1 text-white shadow-glow-primary border-2 border-surface-bg">
                              <Shield size={10} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-ink">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
                            <Mail size={12} />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink-secondary">
                        <MapPin size={14} className="text-primary/60" />
                        {user.college || "Not set"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-bold text-ink-secondary">
                        <Calendar size={14} className="text-ink-tertiary" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-sm font-bold text-ink-secondary">
                      {new Date(user.lastLogin).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                        user.isActive ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {user.isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleRoleToggle(user._id)}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase transition-all ${
                            user.role === "admin" 
                              ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white" 
                              : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                          }`}
                        >
                          {user.role === "admin" 
                            ? <div className="flex items-center gap-1.5"><ShieldOff size={14} /> Demote</div> 
                            : <div className="flex items-center gap-1.5"><Shield size={14} /> Promote</div>}
                        </button>

                        <button 
                          onClick={() => handleToggle(user._id)}
                          disabled={user.role === "admin" && user.firebaseUid === currentUser?.firebaseUid}
                          className={`rounded-xl px-4 py-2 text-xs font-black uppercase transition-all disabled:opacity-30 ${
                            user.isActive 
                              ? "bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white" 
                              : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                          }`}
                        >
                          {user.isActive ? <div className="flex items-center gap-1.5"><UserX size={14} /> Disable</div> : <div className="flex items-center gap-1.5"><UserCheck size={14} /> Enable</div>}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          {filteredUsers.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center p-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-tertiary text-ink-tertiary">
                <Search size={32} />
              </div>
              <p className="text-lg font-black text-ink">No users found</p>
              <p className="text-sm font-medium text-ink-secondary">Try adjusting your search terms.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
