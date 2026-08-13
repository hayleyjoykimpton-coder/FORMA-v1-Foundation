import type { Metadata } from "next";
import { Montserrat, Ubuntu } from "next/font/google";
import { BRAND } from "@/lib/brand";
import "./globals.css";

/** Matches lifeandsoulmayfair.com.au — Montserrat for body & headings. */
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

/** Mayfair site uses Ubuntu (weight 300) on primary buttons. */
const ubuntu = Ubuntu({
  subsets: ["latin"],
  variable: "--font-ubuntu",
  display: "swap",
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: BRAND.name,
  description: BRAND.tagline,
  other: {
    "theme-color": "#1a1410",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${ubuntu.variable}`}>
      <body>{children}</body>
    </html>
  );
}
