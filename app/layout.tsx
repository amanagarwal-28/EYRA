import type { Metadata } from "next";
import { Poppins, Cormorant_Garamond } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

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
    <ClerkProvider>
      <html
        lang="en"
        className={`${poppins.variable} ${cormorant.variable}`}
      >
        <body className="bg-ivory text-carbon font-sans min-h-screen flex flex-col antialiased">
          <AppShell>{children}</AppShell>
        </body>
      </html>
    </ClerkProvider>
  );
}
