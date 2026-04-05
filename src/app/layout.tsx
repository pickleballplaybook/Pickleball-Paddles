import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import NewsletterPopup from "@/components/NewsletterPopup";
import ThemeProvider from "@/components/ThemeProvider";
import { siteConfig } from "@/config/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Best Paddle Deals & Discount Codes`,
    template: `%s | ${siteConfig.name}`,
  },
  description:
    "Find the best pickleball paddle deals with expert reviews, specs, and exclusive discount codes. Use code PLAYBOOK at checkout to save on every paddle.",
  keywords: [
    "pickleball paddles",
    "pickleball discount code",
    "pickleball deals",
    "best pickleball paddle",
    "PLAYBOOK discount",
    "paddle reviews",
    "Pickleball Playbook",
    "JOOLA",
    "Selkirk",
    "Engage",
    "Paddletek",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: siteConfig.name,
    url: siteConfig.siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    site: siteConfig.twitterHandle,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('ppb_theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {/* Single fixed shell — TopBar stacks naturally above Navigation */}
          <div className="fixed inset-x-0 top-0 z-50">
            <TopBar />
            <Navigation />
          </div>
          <main>{children}</main>
          <Footer />
          <NewsletterPopup />
        </ThemeProvider>
      </body>
    </html>
  );
}
