import type { Metadata, Viewport } from "next";
import { Geist_Mono, Outfit } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { PwaRegister } from "@/components/pwa-register";
import { withBase } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lettura Contatori",
  description:
    "Gestione letture contatori condominiali per scala durante i sopralluoghi.",
  manifest: withBase("/manifest.json"),
  appleWebApp: {
    capable: true,
    title: "Lettura Contatori",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: withBase("/icons/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [{ url: withBase("/icons/icon-192.png") }],
  },
};

export const viewport: Viewport = {
  themeColor: "#171717",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
