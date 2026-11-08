import type { Metadata, Viewport } from "next";
import { Cinzel, Cinzel_Decorative, Cormorant_Garamond, IM_Fell_English } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const cinzelDeco = Cinzel_Decorative({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-cinzel-deco",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell-english",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tavern Roll – Virtual Tabletop für D&D",
  description:
    "Erstelle einen Tisch, lade deine Gruppe ein und spielt gemeinsam live auf der Karte.",
};

export const viewport: Viewport = {
  themeColor: "#110e0b",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={`dark ${cinzel.variable} ${cinzelDeco.variable} ${fell.variable} ${cormorant.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
