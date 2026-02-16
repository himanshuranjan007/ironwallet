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
  title: "Iron Wallet — Multisig Smart Wallet on NEAR",
  description:
    "Create and manage multi-signature wallets on the NEAR blockchain. The most trusted smart wallet infrastructure — modular, programmable and battle-tested.",
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
