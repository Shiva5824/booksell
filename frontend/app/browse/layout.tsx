import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Browse Listings`,
  description: `Browse all student listings on ${SITE_NAME} — JEE, NEET, EAPCET, and IPE prep books, calculators, lab manuals, and college essentials, sold by verified students on your campus.`,
  alternates: { canonical: "/browse" },
  openGraph: {
    title: `Browse Listings | ${SITE_NAME}`,
    description: "JEE, NEET, EAPCET, and IPE study material plus calculators and lab gear from verified student sellers.",
    url: "/browse",
    type: "website",
  },
};

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
