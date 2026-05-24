import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Complete your SellChey profile.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
