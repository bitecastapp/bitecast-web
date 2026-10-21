import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bitecast",
  description: "Rate the dish, not the place. A dish-by-dish guide to what's actually worth eating.",
};

export const viewport: Viewport = {
  themeColor: "#f2f6f1",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="flex min-h-dvh flex-col bg-background">{children}</body>
    </html>
  );
}
