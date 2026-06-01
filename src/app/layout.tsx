import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import Navigation from "@/components/Navigation";
import TopBar from "@/components/TopBar";
import Footer from "@/components/Footer";
import StickyNewsletterBar from "@/components/StickyNewsletterBar";
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
  maximumScale: 1,
  viewportFit: "cover",
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
  // Hide marketing chrome on admin routes so the dashboard gets full-height canvas
  const headersList = headers();
  const pathname =
    headersList.get("x-invoke-path") ||
    headersList.get("next-url") ||
    headersList.get("x-pathname") ||
    "";
  const isAdmin = pathname.startsWith("/admin");

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Pickleball Playbook",
            "url": siteConfig.siteUrl,
            "logo": `${siteConfig.siteUrl}/images/Logo.svg`,
            "description": "Independent pickleball paddle reviews, lab-measured specs, and exclusive discount codes. Every review is unsponsored.",
            "sameAs": [siteConfig.youtubeChannelUrl],
            "founder": { "@type": "Person", "name": "Austin Hardy" },
          }) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Pickleball Playbook",
            "url": siteConfig.siteUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${siteConfig.siteUrl}/paddles?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }) }}
        />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem('ppb_theme');if(s==='dark'||(!s&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();` }} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {!isAdmin && (
            <>
              <div
                className="fixed inset-x-0 top-0 pointer-events-none"
                style={{ height: "env(safe-area-inset-top, 0px)", background: "#000", zIndex: 200 }}
              />
              <div
                className="fixed inset-x-0 top-0 z-50"
                style={{ paddingTop: "env(safe-area-inset-top)" }}
              >
                <TopBar />
                <Navigation />
              </div>
            </>
          )}
          <main>{children}</main>
          {!isAdmin && <Footer />}
          {!isAdmin && <StickyNewsletterBar />}
        </ThemeProvider>
      </body>
    </html>
  );
}
