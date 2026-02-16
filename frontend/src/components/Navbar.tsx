"use client";

import Link from "next/link";
import { useNear } from "@/context/NearContext";
import { Shield, LogOut, Wallet } from "lucide-react";

export function Navbar() {
  const { accountId, isSignedIn, loading, signIn, signOut } = useNear();

  return (
    <nav className="sticky top-0 z-50 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold tracking-tight">NearVault</span>
        </Link>

        <div className="flex items-center gap-4">
          {isSignedIn && (
            <Link
              href="/dashboard"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}

          {loading ? (
            <div className="h-9 w-28 animate-pulse rounded-lg bg-card" />
          ) : isSignedIn ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 text-sm font-mono">
                <Wallet className="h-3.5 w-3.5 text-accent" />
                <span className="max-w-[140px] truncate">{accountId}</span>
              </div>
              <button
                onClick={signOut}
                className="rounded-lg p-2 text-muted transition-colors hover:bg-card hover:text-danger"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
