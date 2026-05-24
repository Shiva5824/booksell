import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE_NAME} collects, uses, and protects student data — full privacy policy and your rights as a user.`,
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description: `How ${SITE_NAME} collects, uses, and protects your data.`,
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
