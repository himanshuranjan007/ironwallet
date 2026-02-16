"use client";

import Link from "next/link";
import { useNear } from "@/context/NearContext";
import { Shield, ChevronRight } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "How it Works", href: "#how-it-works" },
];

export function LandingNavbar() {
  const { isSignedIn, signIn } = useNear();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e8e8e8] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121312]">
            <Shield className="h-4.5 w-4.5 text-[#12ff80]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#121312]">
            Iron{" "}
            <span className="font-normal text-[#636669]">{"{Wallet}"}</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-[#636669] transition-colors hover:text-[#121312]"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://docs.near.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-[#636669] transition-colors hover:text-[#121312]"
          >
            Docs ↗
          </a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] transition-all hover:bg-[#0ee872] hover:shadow-lg hover:shadow-[#12ff8040]"
            >
              Launch App
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={signIn}
              className="inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] transition-all hover:bg-[#0ee872] hover:shadow-lg hover:shadow-[#12ff8040]"
            >
              Launch App
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
