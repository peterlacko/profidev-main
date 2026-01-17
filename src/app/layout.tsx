import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Travel Portfolio | Photography",
    template: "%s | Travel Portfolio",
  },
  description:
    "A personal travel photography portfolio showcasing stunning captures from around the world.",
  keywords: [
    "travel photography",
    "landscape photography",
    "nature photography",
    "travel photos",
    "photography portfolio",
  ],
  authors: [{ name: "Travel Photographer" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Travel Portfolio",
    title: "Travel Portfolio | Photography",
    description:
      "A personal travel photography portfolio showcasing stunning captures from around the world.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Travel Portfolio | Photography",
    description:
      "A personal travel photography portfolio showcasing stunning captures from around the world.",
  },
  robots: {
    index: true,
    follow: true,
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
