"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { uploadImages, checkPhoneExists, addLocation } from "@/services/api";
import { INDIAN_COLLEGES } from "@/lib/colleges";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, User, Phone, CheckCircle2, ChevronRight, Search, Camera, Loader2, MapPin, SkipForward } from "lucide-react";
import Image from "next/image";
import LocationPicker from "@/components/LocationPickerNew";

export default function Onboarding() {
  const router = useRouter();
  const { user, dbUser, loading, updateProfile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [college, setCollege] = useState("");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/login");
      } else if (dbUser?.college) {
        router.replace("/");
      } else {
        // Auto-fill from Firebase
        setName(user.displayName || "");
        setAvatar(user.photoURL || "");
        setPhone(user.phoneNumber || "");
      }
    }
  }, [user, dbUser, loading, router]);

  useEffect(() => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setPhoneError("");
      return;
    }

    const digitsOnly = cleanPhone.replace(/\D/g, "");
    
    // 1. Basic length check
    if (digitsOnly.length < 10) {
      setPhoneError("Phone number must be at least 10 digits.");
      return;
    }

    // 2. Indian carrier prefix validation (must start with 6, 7, 8, or 9)
    if (digitsOnly.length === 10) {
      const firstDigit = digitsOnly[0];
      if (!["6", "7", "8", "9"].includes(firstDigit)) {
        setPhoneError("Indian mobile numbers must start with 6, 7, 8, or 9.");
        return;
      }
    }

    // 3. Repeated digits pattern check (e.g. 0000000000, 9999999999)
    const isAllSame = /^(\d)\1+$/.test(digitsOnly);
    if (isAllSame) {
      setPhoneError("Invalid phone number: identical digits are not allowed.");
      return;
    }

    // 4. Sequential digits check (e.g. 1234567890)
    const sequentialPattern = "01234567890123456789";
    if (sequentialPattern.includes(digitsOnly) && digitsOnly.length >= 8) {
      setPhoneError("Invalid phone number: sequential digits are not allowed.");
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingPhone(true);
      try {
        const exists = await checkPhoneExists(cleanPhone);
        if (exists) {
          setPhoneError("User with that number already exists.");
        } else {
          setPhoneError("");
        }
      } catch (err) {
        console.error("Error checking phone:", err);
      } finally {
        setCheckingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [phone]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const urls = await uploadImages([file]);
      if (urls && urls.length > 0) {
        setAvatar(urls[0]);
      }
    } catch (err) {
      alert("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  const filteredColleges = INDIAN_COLLEGES.filter(c => 
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  ).slice(0, 5);

  const handleFinish = async () => {
    if (!name.trim() || !college.trim()) return;
    
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: name.trim(),
        avatar,
        phone,
        college: college.trim()
      });

      if (selectedLocation) {
        setIsSavingLocation(true);
        try {
          await addLocation({
            address: selectedLocation.address,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            label: "Home",
            isDefault: true,
          });
        } catch (err) {
          console.error("Failed to save location:", err);
        } finally {
          setIsSavingLocation(false);
        }
      }

      router.replace("/");
    } catch (err) {
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                step === i ? "w-8 bg-primary" : "w-1.5 bg-border/20"
              }`} 
            />
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[40px] border border-border/10 bg-surface-bg p-8 shadow-soft-lg">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <User size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-ink">What's your name?</h1>
                  <p className="mt-2 text-sm font-medium text-ink-secondary">Let others know who they're buying from.</p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="group relative h-24 w-24 overflow-hidden rounded-3xl bg-surface-tertiary">
                      {avatar ? (
                        <Image src={avatar} alt="Profile" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-tertiary">
                          <User size={40} />
                        </div>
                      )}
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {isUploading ? (
                          <Loader2 className="animate-spin text-white" size={20} />
                        ) : (
                          <>
                            <Camera className="text-white" size={20} />
                            <span className="text-[10px] font-black text-white mt-1">EDIT</span>
                          </>
                        )}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <p className="text-xs font-bold text-primary">Change Photo (Optional)</p>
                  </div>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full rounded-2xl border border-border/10 bg-surface-tertiary px-6 py-4 text-center text-lg font-black text-ink outline-none focus:border-primary/50 transition-all"
                  />
                </div>

                <button
                  disabled={!name.trim()}
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-4 text-lg disabled:opacity-50"
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                    <GraduationCap size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-ink">Where do you study?</h1>
                  <p className="mt-2 text-sm font-medium text-ink-secondary">We'll show you listings from your college first.</p>
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-tertiary" size={18} />
                    <input
                      type="text"
                      value={collegeSearch || college}
                      onChange={(e) => {
                        setCollegeSearch(e.target.value);
                        setCollege(e.target.value);
                      }}
                      placeholder="Search your college..."
                      className="w-full rounded-2xl border border-border/10 bg-surface-tertiary py-4 pl-12 pr-4 text-sm font-bold text-ink outline-none focus:border-primary/50 transition-all"
                    />
                  </div>

                  {collegeSearch && filteredColleges.length > 0 && (
                    <div className="rounded-2xl border border-border/10 bg-surface-bg p-2 shadow-lg">
                      {filteredColleges.map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            setCollege(c);
                            setCollegeSearch("");
                          }}
                          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-ink-secondary hover:bg-surface-tertiary hover:text-ink transition-all"
                        >
                          <GraduationCap size={16} className="text-primary/60" />
                          {c}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {college && !INDIAN_COLLEGES.includes(college) && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary px-2">Custom College Selected</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="btn-secondary flex-1 py-4">Back</button>
                  <button
                    disabled={!college.trim()}
                    onClick={() => setStep(3)}
                    className="btn-primary flex-[2] py-4 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
                    <Phone size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-ink">Contact Details</h1>
                  <p className="mt-2 text-sm font-medium text-ink-secondary">Buyers will use this to reach out (Mandatory).</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full rounded-2xl border border-border/10 bg-surface-tertiary px-6 py-4 text-center text-lg font-black text-ink outline-none focus:border-primary/50 transition-all font-mono"
                    />
                    {phoneError && (
                      <p className="text-xs font-semibold text-red-500 mt-2 text-center">
                        ⚠️ {phoneError}
                      </p>
                    )}
                    {checkingPhone && (
                      <p className="text-xs font-semibold text-primary mt-2 text-center">
                        Checking phone number status...
                      </p>
                    )}
                  </div>
                  
                  <div className="rounded-2xl bg-surface-tertiary p-4 flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs font-black text-ink uppercase tracking-tight">Profile Summary</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-bold text-ink-secondary flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> {name}</p>
                        <p className="text-sm font-bold text-ink-secondary flex items-center gap-2"><CheckCircle2 size={12} className="text-emerald-500" /> {college}</p>
                      </div>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-surface-bg border border-border/10 overflow-hidden relative">
                      {avatar && <Image src={avatar} alt="" fill className="object-cover" />}
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setStep(2)} className="btn-secondary flex-1 py-4">Back</button>
                  <button
                    onClick={() => setStep(4)}
                    disabled={!!phoneError || !phone.trim() || checkingPhone}
                    className="btn-primary flex-[2] py-4 shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step
                    <ChevronRight size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                    <MapPin size={32} />
                  </div>
                  <h1 className="text-2xl font-black text-ink">Set Your Location</h1>
                  <p className="mt-2 text-sm font-medium text-ink-secondary">This helps match you with nearby buyers (Optional).</p>
                </div>

                <LocationPicker
                  onSelectLocation={setSelectedLocation}
                  savedLocations={[]}
                  defaultLocation={selectedLocation || undefined}
                  allowMultiple={false}
                />

                <div className="flex gap-4">
                  <button onClick={() => setStep(3)} className="btn-secondary flex-1 py-4">Back</button>
                  <button
                    onClick={handleFinish}
                    disabled={isSubmitting || isSavingLocation}
                    className="btn-primary flex-[2] py-4 shadow-glow-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || isSavingLocation ? "Saving..." : "Start Exploring"}
                  </button>
                </div>

                <button
                  onClick={handleFinish}
                  disabled={isSubmitting || isSavingLocation}
                  className="w-full p-3 text-center text-sm font-bold text-ink-secondary hover:bg-surface-tertiary rounded-xl transition-colors"
                >
                  Skip for Now
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
