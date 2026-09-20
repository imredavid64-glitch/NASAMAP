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
  ],
  openGraph: {
    title: "NASAMAP — Every human has a seat at the frontier",
    description:
      "Plan. Fly. Live. The Next Frontier — with real NASA data, for every human.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NASAMAP",
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