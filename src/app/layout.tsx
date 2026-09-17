import type { Metadata } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-store";

const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
  axes: ["SOFT", "WONK", "opsz"],
});

const karla = Karla({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-karla",
});

const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Moon & Thread";

export const metadata: Metadata = {
  title: { default: `${siteName} — handmade crochet`, template: `%s · ${siteName}` },
  description:
    "Crochet bags, wearables and home pieces, worked by hand in small batches. Made to order welcome.",
  openGraph: { title: siteName, type: "website" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="min-h-dvh antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
