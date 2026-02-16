import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NearProvider } from "@/context/NearContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ironwallet.near.page"),
  title: {
    default: "Iron{Wallet} | Multisig Smart Wallet on NEAR",
    template: "%s | Iron{Wallet}",
  },
  description:
    "Create and manage multi-signature wallets on NEAR Protocol. The most trusted multisig infrastructure — modular, programmable and battle-tested.",
  keywords: [
    "multisig",
    "wallet",
    "NEAR",
    "NEAR Protocol",
    "smart wallet",
    "multi-signature",
    "crypto",
    "blockchain",
    "iron wallet",
    "multisig wallet",
  ],
  authors: [{ name: "Iron Wallet" }],
  creator: "Iron Wallet",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://ironwallet.near.page",
    siteName: "Iron{Wallet}",
    title: "Iron{Wallet} - Multisig Smart Wallet on NEAR",
    description:
      "Create and manage multi-signature wallets on NEAR Protocol. Modular, programmable and battle-tested.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Iron{Wallet} — Multisig Smart Wallet on NEAR",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Iron{Wallet} — Multisig Smart Wallet on NEAR",
    description:
      "Create and manage multi-signature wallets on NEAR Protocol. Modular, programmable and battle-tested.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
      >
        <NearProvider>
          {children}
        </NearProvider>
      </body>
    </html>
  );
}
