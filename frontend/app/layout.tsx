import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { GoogleAnalytics } from "@next/third-parties/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SellChey | Student Marketplace",
  description: "Buy and sell books, lab gear, calculators, and student essentials inside your college.",
  openGraph: {
    title: "SellChey",
    description: "A fast student marketplace for trusted campus listings.",
    type: "website"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            {children}
          </AuthProvider>
        </ThemeProvider>
        <GoogleAnalytics gaId="G-VXJ1LRDZEZ" />
      </body>
    </html>
  );
}
