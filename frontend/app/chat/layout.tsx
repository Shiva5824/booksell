import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description: "Private messages between buyers and sellers.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
