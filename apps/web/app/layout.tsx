import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Urbanist } from "next/font/google";
import "./globals.css";
import { NavigationTracker } from "@/components/back-link";

// Urbanist only sets the wordmark; Geist is the UI face.
const urbanist = Urbanist({ variable: "--font-urbanist", subsets: ["latin"], weight: ["800", "900"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bitecast",
  description: "Broadcast your bites. Rate the dish, not the place."
};

export const viewport: Viewport = {
  themeColor: "#17111c",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${urbanist.variable} ${geist.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-background">
        {/* The pathname is request data, so it streams in rather than blocking the page shell. */}
        <Suspense fallback={null}>
          <NavigationTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
