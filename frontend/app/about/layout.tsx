import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description:
    "Learn how SellChey connects students across Indian colleges to buy and sell prep books, lab equipment, calculators, and study material on their own campus.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description:
      "How SellChey connects students across Indian colleges to buy and sell prep books and study material on campus.",
    url: "/about",
    type: "website",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
