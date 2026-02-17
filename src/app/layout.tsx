import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CommandPalette } from "@/components/CommandPalette";
import ClientShell from "@/components/ClientShell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

/* ── SEO & Open Graph ──────────────────────────────────────── */

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://dmsuite.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DMSuite — AI Design & Business Suite",
    template: "%s | DMSuite",
  },
  description:
    "Your all-in-one AI-powered creative studio with 250+ tools for design, video, audio, content, marketing, web/UI, documents, and business automation.",
  keywords: [
    "AI design suite",
    "AI creative studio",
    "graphic design AI",
    "video editor AI",
    "content generator",
    "marketing automation",
    "document creator",
    "business tools",
    "DMSuite",
    "DRAMAC",
  ],
  authors: [{ name: "DRAMAC", url: siteUrl }],
  creator: "DRAMAC",
  publisher: "DRAMAC",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "DMSuite",
    title: "DMSuite — AI Design & Business Suite",
    description:
      "250+ AI-powered tools for design, video, audio, content, marketing, web/UI, documents, and business automation.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "DMSuite — AI Creative Studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DMSuite — AI Design & Business Suite",
    description:
      "250+ AI-powered tools for design, video, audio, content, marketing, web/UI, documents, and business.",
    images: ["/og-image.png"],
    creator: "@dramac_ai",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

/* ── Layout ────────────────────────────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {/* Skip-to-content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-950 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <CommandPalette />
          <ClientShell />
          {children}
        </ThemeProvider>
        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{})})}`
          }}
        />
      </body>
    </html>
  );
}
