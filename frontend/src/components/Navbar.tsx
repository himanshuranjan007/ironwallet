"use client";

import Link from "next/link";
import Image from "next/image";
import { useNear } from "@/context/NearContext";
import { LogOut, Wallet } from "lucide-react";

export function Navbar() {
  const { accountId, isSignedIn, loading, signIn, signOut } = useNear();

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e8e8e8] bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Iron Wallet"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-lg font-bold tracking-tight text-[#121312]">
            Iron{" "}
            <span className="font-normal text-[#636669]">{"{Wallet}"}</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[#636669] transition-colors hover:text-[#121312]"
            >
              Dashboard
            </Link>
          )}

          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-xl bg-[#f4f4f4]" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#e2e2e2] bg-white px-3 py-1.5 text-sm font-mono">
                <Wallet className="h-3.5 w-3.5 text-[#121312]" />
                <span className="max-w-[140px] truncate text-[#121312]">{accountId}</span>
              </div>
              <button
                onClick={signOut}
                className="rounded-lg p-2 text-[#636669] transition-colors hover:bg-[#f4f4f4] hover:text-red-500"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] transition-all hover:bg-[#0ee872] hover:shadow-lg hover:shadow-[#12ff8030]"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
