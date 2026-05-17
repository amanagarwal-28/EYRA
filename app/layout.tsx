import type { Metadata } from "next";
import { Poppins, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

/* Poppins — UI / body font (replaces Inter; matches Figma Poppins usage) */
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
  variable: "--font-poppins",
});

/* Cormorant Garamond — display / wordmark font (closest Google Fonts
   equivalent to Charlotte Veronica used in the Figma logo) */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: {
    default: "EYRA — Silver Jewelry",
    template: "%s | EYRA",
  },
  description:
    "Premium sterling silver jewelry, crafted for a bold generation.",
  openGraph: {
    siteName: "EYRA",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${cormorant.variable}`}
    >
      <body className="bg-ivory text-carbon font-sans min-h-screen flex flex-col antialiased">
        <Navbar />
        <main
          className="flex-1"
          style={{ paddingTop: "var(--nav-height)" }}
        >
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
