import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgeIndianRupee,
  BookOpen,
  CheckCircle2,
  Clock3,
  Cpu,
  Heart,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Stethoscope,
  FlaskConical
} from "lucide-react";
import type { User, Product } from "@/lib/types";

async function getProductServer(id: string): Promise<Product | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const url = `${apiUrl}/products/${id}`;
    console.log("Fetching from:", url);

    // FIXED: Use 'no-store' instead of invalid 'revalidate' option
    const res = await fetch(url, {
      cache: "no-store", // Changed from "revalidate"
      next: { revalidate: 60 } // This is used with ISR, but 'no-store' ensures fresh data
    });

    console.log("Fetch response status:", res.status);

    if (!res.ok) {
      console.error(`Failed to fetch product: ${res.status}`);
      const text = await res.text();
      console.error("Response text:", text);
      return null;
    }

    const json = await res.json();
    console.log("Product fetched successfully:", json.data?._id);
    return json.data || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductServer(id);
  return {
    title: product ? `${product.title} | SellChey` : "Listing | SellChey",
    description: product?.description || "Student marketplace listing"
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductServer(id);

  if (!product) {
    notFound();
  }

  const seller =
    typeof product.sellerId === "string"
      ? ({ _id: product.sellerId, name: "Verified seller", email: "", college: product.college } as User)
      : (product.sellerId as User);
  const whatsappText = encodeURIComponent(`Hi, I saw your ${product.title} listing on SellChey. Is it available?`);
  const CategoryIcon = (() => {
    switch (product.category) {
      case "ipe": return BookOpen;
      case "eapcet": return FlaskConical;
      case "jee": return Cpu;
      case "neet": return Stethoscope;
      default: return BookOpen;
    }
  })();
  const postedDate = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(product.createdAt));

  return (
    <main className="bg-gradient-to-b from-surface-secondary via-surface-bg to-surface-secondary min-h-screen pb-nav">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Back Button */}
        <Link href="/" className="mb-6 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-bg px-4 py-2.5 font-semibold text-ink-secondary transition-smooth hover:bg-surface-tertiary">
          <ArrowLeft size={18} />
          Back to Listings
        </Link>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Image Section */}
          <section className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-surface-secondary shadow-soft">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 55vw"
              />

              {/* Status Badge */}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className={`rounded-lg px-3 py-2 text-xs font-bold ${product.status === 'sold'
                  ? 'bg-ink text-white'
                  : 'bg-primary text-white'
                  }`}>
                  {product.status === 'sold' ? 'Sold' : 'Available'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="absolute right-4 top-4 flex gap-2">
                <button className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-bg/90 backdrop-blur text-ink transition-smooth hover:text-secondary hover:scale-110" aria-label="Save listing">
                  <Heart size={20} />
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-lg bg-surface-bg/90 backdrop-blur text-ink transition-smooth hover:text-primary hover:scale-110" aria-label="Share listing">
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide sm:grid sm:grid-cols-4">
                {product.images.slice(0, 4).map((image, idx) => (
                  <div key={image} className="relative aspect-square h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/10 bg-surface-secondary cursor-pointer hover:border-primary transition-smooth sm:h-auto sm:w-auto">
                    <Image src={image} alt={`${product.title} - ${idx + 1}`} fill className="object-cover" sizes="15vw" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          {/* Details Section */}
          <section className="space-y-5">
            {/* Main Info Card */}
            <div className="rounded-xl border border-border bg-surface-bg p-6 shadow-soft">
              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center gap-2 rounded-lg bg-primary-light px-3 py-1.5 text-xs font-bold text-primary">
                  <CategoryIcon size={14} />
                  {product.category}
                </span>
                <span className="rounded-lg bg-accent-light px-3 py-1.5 text-xs font-bold text-accent">
                  {product.condition}
                </span>
                <span className="flex items-center gap-1 rounded-lg bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-ink-tertiary">
                  <Clock3 size={14} />
                  {postedDate}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-black leading-tight text-ink mb-3 sm:text-3xl lg:text-4xl">{product.title}</h1>

              {/* Price */}
              <div className="flex items-center gap-2 text-2xl font-black text-gradient mb-5 sm:text-3xl lg:text-4xl">
                <BadgeIndianRupee size={32} />
                ₹{product.price.toLocaleString("en-IN")}
              </div>

              {/* Description */}
              <p className="text-lg leading-relaxed text-ink-secondary mb-6">{product.description}</p>

              {/* Details Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-surface-secondary p-4 text-center">
                  <p className="text-xs font-semibold text-ink-tertiary mb-2 uppercase tracking-wide">Condition</p>
                  <p className="text-lg font-black text-ink">{product.condition}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-4 text-center">
                  <p className="text-xs font-semibold text-ink-tertiary mb-2 uppercase tracking-wide">Category</p>
                  <p className="text-lg font-black text-ink">{product.category}</p>
                </div>
                <div className="rounded-lg bg-surface-secondary p-4 text-center">
                  <p className="text-xs font-semibold text-ink-tertiary mb-2 uppercase tracking-wide">Status</p>
                  <p className="text-lg font-black text-ink">{product.status}</p>
                </div>
              </div>
            </div>

            {/* Seller Card */}
            <div className="rounded-xl border border-border bg-surface-bg p-6 shadow-soft">
              {/* Seller Info */}
              <div className="flex items-center gap-4 mb-6">
                <Image
                  src={seller.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=80"}
                  alt={seller.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-lg object-cover border border-border"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-ink text-lg">{seller.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-ink-secondary mt-1">
                    <MapPin size={16} className="text-primary shrink-0" />
                    {product.college}
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="space-y-2.5 mb-6 pb-6 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                  <ShieldCheck size={18} className="text-primary shrink-0" />
                  Verified seller on SellChey
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-ink-secondary">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  Secure messaging & payments
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid gap-3 grid-cols-1">
                <Link href={`/chat?product=${product._id}`} className="btn-primary justify-center">
                  <MessageCircle size={20} />
                  Message Seller
                </Link>
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  className="btn-secondary justify-center"
                >
                  <Phone size={20} />
                  WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
