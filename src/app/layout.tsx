import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import { withBase } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lettura Contatori",
  description:
    "Letture acqua calda e riscaldamento per scala, anche offline sul telefono.",
  applicationName: "Lettura Contatori",
  manifest: withBase("/manifest.webmanifest"),
  appleWebApp: {
    capable: true,
    title: "Lettura Contatori",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: withBase("/favicon.svg"), type: "image/svg+xml" },
      { url: withBase("/favicon-32.png"), sizes: "32x32", type: "image/png" },
      { url: withBase("/icon-192.png"), sizes: "192x192", type: "image/png" },
      { url: withBase("/icon-512.png"), sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: withBase("/apple-touch-icon.png"), sizes: "180x180" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "Lettura Contatori",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAFA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="it"
      className={`${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#fafafa] text-foreground">
        {children}
        <Toaster position="top-center" richColors closeButton />
        <PwaRegister />
      </body>
    </html>
  );
}
