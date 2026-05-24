import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { Product } from "@/lib/types";
import ProductDetailClient from "@/components/ProductDetailClient";
import {
  SITE_NAME,
  absoluteUrl,
  productJsonLd,
  breadcrumbJsonLd,
  jsonLdScript,
} from "@/lib/seo";

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductServer(id);

  if (!product) {
    return {
      title: "Listing not found",
      description: `This listing isn't available on ${SITE_NAME} anymore.`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${product.title} — ₹${product.price.toLocaleString("en-IN")}`;
  const description =
    product.description?.slice(0, 160) ||
    `${product.title} for sale on ${SITE_NAME}. ${product.condition || "good"} condition. Connect with verified student sellers on your campus.`;
  const canonical = `/product/${product._id}`;
  const images = product.images && product.images.length > 0 ? product.images : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: SITE_NAME,
      images: images?.map((src) => ({ url: src })),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images,
    },
    robots: product.status === "sold"
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : undefined,
    other: {
      "product:price:amount": String(product.price),
      "product:price:currency": "INR",
      "product:availability":
        product.status === "sold" ? "out of stock" : "in stock",
      "product:condition":
        product.condition === "new" ? "new" : "used",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductServer(id);

  if (!product) {
    notFound();
  }

  const jsonLdProduct = productJsonLd(product);
  const jsonLdBreadcrumb = breadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Browse", url: "/browse" },
    { name: product.title, url: `/product/${product._id}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLdProduct)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLdBreadcrumb)}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
