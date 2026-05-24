/**
 * SEO helpers — centralized so site URL, default metadata, and JSON-LD
 * builders all live in one place. Tweak SITE_URL / SITE_NAME here.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://sellchey.com";

export const SITE_NAME = "SellChey";

export const SITE_DESCRIPTION =
  "India's student marketplace for college books, lab gear, calculators, and prep material — buy and sell on your own campus.";

/** Resolve any relative path against SITE_URL. Idempotent for absolute URLs. */
export function absoluteUrl(path: string = "/"): string {
  if (!path) return SITE_URL;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** JSON-LD Organization payload (used in root layout). */
export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/icon.png"),
  sameAs: [] as string[],
};

/** JSON-LD WebSite payload with site search action. */
export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/browse?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/** Build a JSON-LD Product schema payload from a product record. */
export function productJsonLd(product: {
  _id: string;
  title: string;
  description?: string;
  price: number;
  images?: string[];
  condition?: string;
  status?: string;
  category?: string;
  college?: string;
  sellerId?: any;
}) {
  const conditionMap: Record<string, string> = {
    new: "https://schema.org/NewCondition",
    good: "https://schema.org/UsedCondition",
    used: "https://schema.org/UsedCondition",
  };
  const sellerName =
    typeof product.sellerId === "object" && product.sellerId?.name
      ? product.sellerId.name
      : "SellChey Seller";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description || `${product.title} for sale on ${SITE_NAME}.`,
    image: product.images && product.images.length > 0 ? product.images : undefined,
    sku: product._id,
    category: product.category,
    itemCondition: conditionMap[product.condition || "good"] || "https://schema.org/UsedCondition",
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability:
        product.status === "sold"
          ? "https://schema.org/SoldOut"
          : "https://schema.org/InStock",
      url: absoluteUrl(`/product/${product._id}`),
      seller: { "@type": "Person", name: sellerName },
    },
  };
}

/** Build a JSON-LD BreadcrumbList payload. */
export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

/** Helper to render a JSON-LD <script> tag inline. */
export function jsonLdScript(payload: unknown): {
  __html: string;
} {
  return { __html: JSON.stringify(payload) };
}
