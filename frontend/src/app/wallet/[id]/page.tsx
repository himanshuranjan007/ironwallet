"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNear } from "@/context/NearContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  getWalletInfo,
  getRequests,
  getAccountBalance,
  formatNear,
  confirmRequest,
  revokeConfirmation,
  deleteRequest,
  invalidateCache,
} from "@/lib/multisig";
import { addStoredWallet } from "@/lib/storage";
import type { WalletInfo, MultiSigRequestView } from "@/types";
import { RequestCard } from "@/components/RequestCard";
import { NewRequestModal } from "@/components/NewRequestModal";
import { TransactionHistory } from "@/components/TransactionHistory";
import {
  Shield,
  Users,
  ChevronLeft,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Send,
  ArrowDownLeft,
} from "lucide-react";
import { getConfig } from "@/config/near";

export default function WalletPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const walletId = params.id as string;
  const { selector, accountId, isSignedIn } = useNear();

  const [info, setInfo] = useState<WalletInfo | null>(null);
  const [requests, setRequests] = useState<MultiSigRequestView[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");

  const config = getConfig();
  const isNewWallet = !!searchParams.get("transactionHashes");

  const fetchData = useCallback(async () => {
    try {
      const [walletInfo, reqs, bal] = await Promise.all([
        getWalletInfo(walletId),
        getRequests(walletId),
        getAccountBalance(walletId),
      ]);
      setInfo(walletInfo);
      setRequests(reqs);
      setBalance(bal);
      setError(null);

      addStoredWallet({
        accountId: walletId,
        name: walletId.split(".")[0],
        createdAt: Date.now(),
      });
    } catch (err) {
      console.error("Failed to load wallet:", err);
      setError(
        `Could not load wallet. ${err instanceof Error ? err.message : "Make sure the account exists and has a multisig contract deployed."}`
      );
    } finally {
      setLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    setLoading(true);
    if (isNewWallet) {
      const timer = setTimeout(() => fetchData(), 1500);
      return () => clearTimeout(timer);
    }
    fetchData();
  }, [fetchData, isNewWallet]);

  const refreshAfterAction = useCallback(() => {
    invalidateCache(walletId);
    fetchData();
  }, [walletId, fetchData]);

  const handleConfirm = async (requestId: number) => {
    if (!selector) return;
    try {
      await confirmRequest(selector, walletId, requestId);
      refreshAfterAction();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to confirm");
    }
  };

  const handleRevoke = async (requestId: number) => {
    if (!selector) return;
    try {
      await revokeConfirmation(selector, walletId, requestId);
      refreshAfterAction();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to revoke");
    }
  };

  const handleDelete = async (requestId: number) => {
    if (!selector) return;
    if (!confirm("Delete this request?")) return;
    try {
      await deleteRequest(selector, walletId, requestId);
      refreshAfterAction();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1 text-sm text-[#636669] transition-colors hover:text-[#121312]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Skeleton */}
          <div className="mb-6 rounded-2xl border border-[#e2e2e2] bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 animate-pulse rounded-xl bg-[#f4f4f4]" />
              <div>
                <div className="h-6 w-40 animate-pulse rounded bg-[#f4f4f4] mb-2" />
                <div className="h-4 w-64 animate-pulse rounded bg-[#f4f4f4]" />
              </div>
            </div>
            <div className="h-20 animate-pulse rounded-xl bg-[#f4f4f4]" />
          </div>

          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#12ff80]" />
            <span className="ml-2 text-sm text-[#636669]">Loading wallet data...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-1 text-sm text-[#636669] transition-colors hover:text-[#121312]"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <Shield className="mx-auto mb-4 h-10 w-10 text-red-400" />
            <h2 className="text-xl font-semibold text-red-600">
              Wallet Not Found
            </h2>
            <p className="mt-2 text-sm text-[#636669]">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                invalidateCache(walletId);
                fetchData();
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-4 py-2 text-sm font-semibold text-[#121312]"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#636669] transition-colors hover:text-[#121312]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* ── Header Card ────────────────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-[#e2e2e2] bg-white overflow-hidden">
          {/* Top section */}
          <div className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#121312] shrink-0">
                  <Shield className="h-6 w-6 text-[#12ff80]" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-[#121312]">
                    {walletId.split(".")[0]}
                  </h1>
                  <div className="mt-1.5 flex items-center gap-2">
                    <code className="text-sm text-[#636669] truncate">{walletId}</code>
                    <button
                      onClick={copyAddress}
                      className="rounded p-1 text-[#636669] transition-colors hover:text-[#121312] hover:bg-[#f4f4f4]"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-[#12ff80]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                    <a
                      href={`${config.explorerUrl}/address/${walletId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded p-1 text-[#636669] transition-colors hover:text-[#121312] hover:bg-[#f4f4f4]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 shrink-0">
                {isSignedIn && info?.members.includes(accountId!) && (
                  <button
                    onClick={() => setShowNewRequest(true)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040]"
                  >
                    <Send className="h-4 w-4" />
                    New Transaction
                  </button>
                )}
                <button
                  onClick={copyAddress}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-5 py-2.5 text-sm font-medium text-[#121312] transition-all hover:border-[#12ff8060] hover:shadow-sm"
                >
                  <ArrowDownLeft className="h-4 w-4" />
                  Receive
                </button>
              </div>
            </div>

            {/* Balance */}
            {balance && (
              <div className="mt-6 rounded-xl bg-[#f8fdf8] border border-[#12ff8020] px-5 py-4">
                <p className="text-xs text-[#636669] mb-1">Total Balance</p>
                <p className="text-3xl font-bold font-mono text-[#121312]">
                  {formatNear(balance)}{" "}
                  <span className="text-base font-normal text-[#636669]">NEAR</span>
                </p>
              </div>
            )}
          </div>

          {/* Members */}
          {info && (
            <div className="border-t border-[#e8e8e8] px-6 py-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#636669]">
                <Users className="h-4 w-4" />
                Members ({info.members.length}) — {info.num_confirmations} of{" "}
                {info.members.length} required
              </div>
              <div className="flex flex-wrap gap-2">
                {info.members.map((m) => (
                  <span
                    key={m}
                    className={`rounded-lg px-3 py-1.5 font-mono text-xs ${m === accountId
                        ? "bg-[#12ff8018] text-[#121312] border border-[#12ff8040] font-medium"
                        : "bg-[#f4f4f4] border border-[#e2e2e2] text-[#636669]"
                      }`}
                  >
                    {m}
                    {m === accountId && (
                      <span className="ml-1.5 text-[10px] font-semibold text-[#0ee872]">
                        (you)
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center gap-6 border-b border-[#e8e8e8]">
          <button
            onClick={() => setActiveTab("queue")}
            className={`relative pb-3 text-sm font-semibold transition-colors ${activeTab === "queue"
                ? "text-[#121312] tab-active"
                : "text-[#636669] hover:text-[#121312]"
              }`}
          >
            Queue
            {requests.length > 0 && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`relative pb-3 text-sm font-semibold transition-colors ${activeTab === "history"
                ? "text-[#121312] tab-active"
                : "text-[#636669] hover:text-[#121312]"
              }`}
          >
            History
          </button>

          <div className="ml-auto mb-3">
            <button
              onClick={() => {
                invalidateCache(walletId);
                fetchData();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e2e2] text-[#636669] transition-colors hover:bg-white hover:text-[#121312]"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Tab Content ────────────────────────────────────────── */}
        {activeTab === "queue" ? (
          <>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#e2e2e2] bg-white py-16">
                <Shield className="mb-3 h-10 w-10 text-[#636669]" />
                <p className="text-[#636669] font-medium">No pending requests</p>
                <p className="mt-1 text-xs text-[#636669]">
                  All transactions have been processed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    currentAccount={accountId}
                    onConfirm={() => handleConfirm(req.id)}
                    onRevoke={() => handleRevoke(req.id)}
                    onDelete={() => handleDelete(req.id)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <TransactionHistory walletId={walletId} />
        )}

        {/* New Request Modal */}
        {showNewRequest && (
          <NewRequestModal
            walletId={walletId}
            onClose={() => setShowNewRequest(false)}
            onSuccess={() => {
              setShowNewRequest(false);
              refreshAfterAction();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
