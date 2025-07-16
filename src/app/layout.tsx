// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Sans } from "next/font/google";
import {Poppins} from "next/font/google";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProviderWrapper";
import { AppKit } from "@/context/appkit";
import Navbar from "@/components/common/navbar";
import Footer from "@/components/common/Footer";
import { Toaster } from "sonner";
import AppKitThemeCustomizer from "@/components/AppKitThemeCustomizer";
import ProrectedRoute from "@/components/ProtectedRoute";


const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.stories.fun/"),
  title: "app.stories.fun",
  description: "Stories.fun is a social media platform for creators to share their stories and launch tokens related to their stories.",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: [{ url: "/logo.png" }],
  },
  openGraph: {
    title: "app.stories.fun",
    description: "Stories.fun is a social media platform for creators to share their stories and launch tokens related to their stories.",
   url: "https://app.stories.fun/",
    siteName: "app.stories.fun",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Guiding Humanity to the Agentic Future",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "app.stories.fun",
    description: "Stories.fun is a social media platform for creators to share their stories and launch tokens related to their stories.",
  images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Guiding Humanity to the Agentic Future",
      },
    ],
    site: "https://x.com/StoriesDotFun",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${instrumentSans.variable} antialiased`}
      >
        <WalletProviderWrapper>
          <AppKit>
            {/* 👇 Mount the theme customizer globally */}
            <AppKitThemeCustomizer />

            <Navbar />
            <main className="flex-grow min-h-[calc(100vh-200px)]">
              <ProrectedRoute>
                {children}
              </ProrectedRoute>
            </main>
            <Footer />
            <Toaster richColors />
          </AppKit>
        </WalletProviderWrapper>
      </body>
    </html>
  );
}
