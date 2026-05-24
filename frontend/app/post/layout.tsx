import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Post a Listing",
  description: "Sell your books and study material on SellChey.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
