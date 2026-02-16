"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNear } from "@/context/NearContext";
import { getStoredWallets, removeStoredWallet } from "@/lib/storage";
import { getWalletInfo, getAccountBalance, formatNear } from "@/lib/multisig";
import type { StoredWallet, WalletInfo } from "@/types";
import {
  Plus,
  Shield,
  Users,
  ArrowRightLeft,
  Trash2,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface WalletWithInfo extends StoredWallet {
  info?: WalletInfo;
  balance?: string;
  loading?: boolean;
  error?: boolean;
}

export default function DashboardPage() {
  const { isSignedIn, loading: nearLoading } = useNear();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletWithInfo[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);

  const enrichWallet = useCallback(async (w: StoredWallet): Promise<WalletWithInfo> => {
    try {
      const [info, balance] = await Promise.all([
        getWalletInfo(w.accountId),
        getAccountBalance(w.accountId),
      ]);
      return { ...w, info, balance, loading: false };
    } catch {
      return { ...w, error: true, loading: false };
    }
  }, []);

  const loadWallets = useCallback(async () => {
    const stored = getStoredWallets();
    if (stored.length === 0) {
      setWallets([]);
      setInitialLoad(false);
      return;
    }

    // Show wallets immediately with loading state
    setWallets(stored.map((w) => ({ ...w, loading: true })));
    setInitialLoad(false);

    // Enrich all wallets in parallel, update each as it resolves
    stored.forEach(async (w) => {
      const enriched = await enrichWallet(w);
      setWallets((prev) =>
        prev.map((p) => (p.accountId === enriched.accountId ? enriched : p))
      );
    });
  }, [enrichWallet]);

  useEffect(() => {
    if (!nearLoading && !isSignedIn) {
      router.push("/");
      return;
    }
    if (isSignedIn) {
      loadWallets();
    }
  }, [isSignedIn, nearLoading, router, loadWallets]);

  const handleRemove = (accountId: string) => {
    if (confirm("Remove this wallet from your dashboard? This only removes it from your local list.")) {
      removeStoredWallet(accountId);
      setWallets((prev) => prev.filter((w) => w.accountId !== accountId));
    }
  };

  if (nearLoading || (initialLoad && isSignedIn)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Wallets</h1>
          <p className="mt-1 text-muted">
            Manage your multi-signature wallets
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadWallets}
            className="rounded-lg border border-card-border p-2.5 text-muted transition-colors hover:bg-card hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Wallet
          </Link>
        </div>
      </div>

      {wallets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-card-border py-20">
          <Shield className="mb-4 h-12 w-12 text-muted" />
          <h2 className="text-xl font-semibold">No wallets yet</h2>
          <p className="mt-2 text-muted">
            Create your first multi-signature wallet to get started.
          </p>
          <Link
            href="/create"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black"
          >
            <Plus className="h-4 w-4" />
            Create Wallet
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {wallets.map((w) => (
            <div
              key={w.accountId}
              className="group relative rounded-2xl border border-card-border bg-card p-5 transition-colors hover:border-accent/30"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemove(w.accountId);
                }}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-muted opacity-0 transition-all hover:bg-danger-dim hover:text-danger group-hover:opacity-100"
                title="Remove from list"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>

              <Link href={`/wallet/${w.accountId}`}>
                <div className="mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-accent" />
                  <span className="font-semibold">{w.name || w.accountId}</span>
                </div>

                <p className="mb-4 font-mono text-xs text-muted">
                  {w.accountId}
                </p>

                {w.loading ? (
                  <div className="flex gap-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-card-border" />
                    <div className="h-4 w-20 animate-pulse rounded bg-card-border" />
                    <div className="ml-auto h-4 w-16 animate-pulse rounded bg-card-border" />
                  </div>
                ) : w.error ? (
                  <p className="text-sm text-danger">
                    Could not load wallet info
                  </p>
                ) : w.info ? (
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-muted">
                      <Users className="h-3.5 w-3.5" />
                      {w.info.members.length} members
                    </div>
                    <div className="flex items-center gap-1.5 text-muted">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      {w.info.active_requests} pending
                    </div>
                    {w.balance && (
                      <div className="ml-auto font-mono text-accent">
                        {formatNear(w.balance)} NEAR
                      </div>
                    )}
                  </div>
                ) : null}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
