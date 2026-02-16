import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NearProvider } from "@/context/NearContext";
import { Navbar } from "@/components/Navbar";
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
  title: "NearVault — Multisig Smart Wallet",
  description:
    "Create and manage multi-signature wallets on the NEAR blockchain. Secure your funds with multiple approvals.",
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
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </NearProvider>
      </body>
    </html>
  );
}
