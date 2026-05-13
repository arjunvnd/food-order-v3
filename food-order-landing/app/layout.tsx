import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mallbite.com",
  ),
  title: {
    default: "MallBite — Beat the Queue, Serve Smarter",
    template: "%s | MallBite",
  },
  description:
    "MallBite is a QR-code ordering platform for food courts, malls and restaurants. Customers order at the table, vendors serve faster, and queues disappear.",
  keywords: [
    "food court ordering",
    "QR code menu",
    "restaurant queue management",
    "mall food ordering",
    "table ordering system",
    "beat the queue",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mallbite.com",
    siteName: "MallBite",
    title: "MallBite — Beat the Queue, Serve Smarter",
    description:
      "MallBite is a QR-code ordering platform for food courts, malls and restaurants. No queues, no friction — just great food.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MallBite — QR-code ordering for food courts",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MallBite — Beat the Queue, Serve Smarter",
    description:
      "QR-code ordering for food courts and malls. No queues, no friction.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable}`}>
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
