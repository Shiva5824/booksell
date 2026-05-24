import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface SitemapProduct {
  _id: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

/**
 * Fetch all active products from the API for inclusion in the sitemap.
 * Falls back gracefully if the backend is unreachable so a deploy still
 * generates a valid sitemap with the static routes.
 */
async function getAllProductsForSitemap(): Promise<SitemapProduct[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/products?limit=10000`, {
      // ISR: refresh sitemap data every hour
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    const list: SitemapProduct[] = json?.data || [];
    return list.filter((p) => p && p._id);
  } catch (err) {
    console.warn("[sitemap] failed to fetch products:", err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/browse`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Per-category browse URLs — useful landing pages for SEO.
  const categoryRoutes: MetadataRoute.Sitemap = (
    ["jee", "neet", "eapcet", "ipe"] as const
  ).map((cat) => ({
    url: `${SITE_URL}/browse?category=${cat}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const products = await getAllProductsForSitemap();
  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p._id}`,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : p.createdAt ? new Date(p.createdAt) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
