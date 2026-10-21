import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const shoulders = Big_Shoulders({
  variable: "--font-shoulders",
  subsets: ["latin"],
  axes: ["opsz"],
  // next/font has no metrics for this face, so name a condensed fallback ourselves.
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "sans-serif"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bitecast",
  description: "Rate the dish, not the place. Bengaluru's dish-by-dish scoreboard.",
};

export const viewport: Viewport = {
  themeColor: "#0b3c2b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${shoulders.variable} ${hanken.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-board">{children}</body>
    </html>
  );
}
