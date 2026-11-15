import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "RailBandhan | Every journey, a new connection",
    template: "%s | RailBandhan",
  },
  description:
    "A little more India. A little more connection. Find your train community, share the journey and travel under an anonymous handle with RailBandhan.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RailBandhan",
  },
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "RailBandhan | Every journey, a new connection",
    description: "The community between your first stop and your last.",
    images: [
      { url: "/images/hero_train_window.webp", width: 1376, height: 768 },
    ],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#f7f5ef",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Reading headers keeps nonce-bearing documents request-scoped.
  await headers();
  return (
    <html lang="en" className="light" data-scroll-behavior="smooth">
      <body>
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
