import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // Controls browser chrome color on Android Chrome + iOS Safari 15+
  themeColor: "#000000",
};

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
        {/* iOS Safari status bar — black even before JS hydrates */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {/* Single fixed shell */}
          <div className="fixed inset-x-0 top-0 z-50">
            {/* Safe-area inset — dark strip behind status bar on notched iPhones (0px on desktop) */}
            <div style={{ height: "env(safe-area-inset-top, 0px)", background: "#000" }} />
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
