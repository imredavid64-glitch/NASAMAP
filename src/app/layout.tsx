import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/ui/toast";
import { JudgeTourProvider } from "@/components/judge-tour-provider";
import { PWAInstallPrompt } from "@/components/pwa-install";
import { ErrorBoundary } from "@/components/error-boundary";

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

// The canonical origin. Override with NEXT_PUBLIC_SITE_URL when the app is
// published to a different host (e.g. a Cloudflare Workers domain).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nasamap.vercel.app").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
  // `openGraph-image.tsx` generates the card, so Next injects the image URL
  // (and its hash) itself — naming a file here would override it with a 404.
  openGraph: {
    title: "NASAMAP — Every human has a seat at the frontier",
    description:
      "Plan. Fly. Live. The Next Frontier — with real NASA data, for every human.",
    type: "website",
    url: SITE_URL,
    siteName: "NASAMAP",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NASAMAP — Every human has a seat at the frontier",
    description:
      "Plan, fly and live a real Moon-to-Mars mission with real NASA data. Built for NASA Space Apps Challenge 2026.",
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
        {/* React's Fizz runtime completes streamed <Suspense> boundaries through
            requestAnimationFrame (see $RC/$RV in Next.js' inline React runtime).
            rAF is paused in hidden/occluded tabs, embedded frames and headless
            browsers, which would leave the page stuck on its loading fallback.
            Pre-seeding $RT makes React schedule that completion with setTimeout
            instead, so the first paint never depends on an animation frame. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof window.$RT!=="number"){window.$RT=performance.now()-300;}}catch(e){}})();`,
          }}
        />
        <ToastProvider>
          <JudgeTourProvider>
            <ErrorBoundary>
              <div className="flex min-h-screen flex-col">
                <Nav />
                <main id="main-content" className="flex-1">{children}</main>
                <Footer />
              </div>
              <PWAInstallPrompt />
            </ErrorBoundary>
          </JudgeTourProvider>
        </ToastProvider>
      </body>
    </html>
  );
}