"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useNear } from "@/context/NearContext";
import { DashboardLayout } from "@/components/DashboardLayout";
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
  ChevronRight,
  Wallet,
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

    setWallets(stored.map((w) => ({ ...w, loading: true })));
    setInitialLoad(false);

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
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#12ff80]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#121312]">Your Wallets</h1>
            <p className="mt-1 text-sm text-[#636669]">
              Manage your multi-signature wallets
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadWallets}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#e2e2e2] bg-white text-[#636669] transition-colors hover:text-[#121312] hover:border-[#12ff8060] hover:shadow-sm"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <Link
              href="/create"
              className="inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040]"
            >
              <Plus className="h-4 w-4" />
              Create Wallet
            </Link>
          </div>
        </div>

        {wallets.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e2e2e2] bg-white py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#12ff8018]">
              <Wallet className="h-8 w-8 text-[#121312]" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-[#121312]">
              No wallets yet
            </h2>
            <p className="mt-2 text-sm text-[#636669]">
              Create your first multi-signature wallet to get started.
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872]"
            >
              <Plus className="h-4 w-4" />
              Create Wallet
            </Link>
          </div>
        ) : (
          /* Wallet grid */
          <div className="grid gap-4 sm:grid-cols-2">
            {wallets.map((w) => (
              <div
                key={w.accountId}
                className="group relative rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060] hover:shadow-lg hover:shadow-[#12ff8010]"
              >
                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(w.accountId);
                  }}
                  className="absolute right-3 top-3 rounded-lg p-1.5 text-[#636669] opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Remove from list"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>

                <Link href={`/wallet/${w.accountId}`} className="block">
                  {/* Wallet icon + name */}
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#121312]">
                      <Shield className="h-5 w-5 text-[#12ff80]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#121312] truncate">
                        {w.name || w.accountId.split(".")[0]}
                      </p>
                      <p className="font-mono text-xs text-[#636669] truncate">
                        {w.accountId}
                      </p>
                    </div>
                  </div>

                  {w.loading ? (
                    <div className="flex gap-4 mt-2">
                      <div className="h-4 w-24 animate-pulse rounded bg-[#f4f4f4]" />
                      <div className="h-4 w-20 animate-pulse rounded bg-[#f4f4f4]" />
                      <div className="ml-auto h-4 w-16 animate-pulse rounded bg-[#f4f4f4]" />
                    </div>
                  ) : w.error ? (
                    <p className="mt-2 text-sm text-red-500">
                      Could not load wallet info
                    </p>
                  ) : w.info ? (
                    <>
                      {/* Balance */}
                      {w.balance && (
                        <div className="mt-3 mb-4 rounded-xl bg-[#f8fdf8] border border-[#12ff8020] px-4 py-3">
                          <p className="text-xs text-[#636669] mb-0.5">Balance</p>
                          <p className="text-lg font-bold text-[#121312] font-mono">
                            {formatNear(w.balance)}{" "}
                            <span className="text-xs font-normal text-[#636669]">NEAR</span>
                          </p>
                        </div>
                      )}

                      {/* Stats row */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5 text-[#636669]">
                            <Users className="h-3.5 w-3.5" />
                            <span>{w.info.members.length} members</span>
                          </div>
                          {w.info.active_requests > 0 && (
                            <div className="flex items-center gap-1.5">
                              <ArrowRightLeft className="h-3.5 w-3.5 text-amber-500" />
                              <span className="font-medium text-amber-600">
                                {w.info.active_requests} pending
                              </span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#636669]" />
                      </div>
                    </>
                  ) : null}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
