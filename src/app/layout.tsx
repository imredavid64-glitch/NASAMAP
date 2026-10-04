import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/ui/toast";
import { JudgeTourProvider } from "@/components/judge-tour";
import { PWAInstallPrompt } from "@/components/pwa-install";
import { ConvexProvider } from "@/components/convex-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nasamap.vercel.app"),
  title: {
    default: "NASAMAP — Every human has a seat at the frontier",
    template: "%s · NASAMAP",
  },
  description:
    "Plan, fly and live a real Moon-to-Mars mission. Turn cosmic data into everyday decisions for farmers, fishers, students and dreamers. No account. Open data. Built for the NASA Space Apps Challenge.",
  keywords: [
    "NASA",
    "Space Apps",
    "Mars",
    "Moon",
    "Artemis",
    "orbit",
    "orbital mechanics",
    "space weather",
    "agriculture",
    "NASA data",
    "mission design",
    "space exploration",
    "ISS",
    "Voyager",
    "Apollo",
  ],
  authors: [{ name: "David" }],
  creator: "David",
  publisher: "NASAMAP",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "NASAMAP — Every human has a seat at the frontier",
    description:
      "Plan. Fly. Live. The Next Frontier — with real NASA data, for every human.",
    type: "website",
    url: "https://nasamap.vercel.app",
    siteName: "NASAMAP",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "NASAMAP — Every human has a seat at the frontier",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NASAMAP — Every human has a seat at the frontier",
    description:
      "Plan, fly and live a real Moon-to-Mars mission with real NASA data. Built for NASA Space Apps Challenge 2026.",
    images: ["/opengraph-image.png"],
    creator: "@nasamap",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NASAMAP",
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#030712",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans`}>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>
          <ConvexProvider>
            <JudgeTourProvider>
              <div className="flex min-h-screen flex-col">
                <Nav />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer />
              </div>
              <PWAInstallPrompt />
            </JudgeTourProvider>
          </ConvexProvider>
        </ToastProvider>
      </body>
    </html>
  );
}