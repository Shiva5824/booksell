import { notFound } from "next/navigation";
import type { Product } from "@/lib/types";
import ProductDetailClient from "@/components/ProductDetailClient";

async function getProductServer(id: string): Promise<Product | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const url = `${apiUrl}/products/${id}`;

    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) return null;

    const json = await res.json();
    return json.data || null;
  } catch {
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
  return <ProductDetailClient product={product} />;
}
