"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNear } from "@/context/NearContext";
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
  Plus,
  Copy,
  Check,
  ExternalLink,
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

  const config = getConfig();

  // Check if we just came from a wallet creation (MyNearWallet redirect)
  const isNewWallet = !!searchParams.get("transactionHashes");

  const fetchData = useCallback(
    async () => {
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
    },
    [walletId]
  );

  useEffect(() => {
    setLoading(true);

    if (isNewWallet) {
      // Newly created wallet -- wait a moment for finalization then fetch
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
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Skeleton header */}
        <div className="mb-6 rounded-2xl border border-card-border bg-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-6 w-6 text-accent" />
            <div className="h-7 w-40 animate-pulse rounded bg-card-border" />
          </div>
          <div className="h-4 w-64 animate-pulse rounded bg-card-border mb-6" />
          <div className="border-t border-card-border pt-4">
            <div className="h-4 w-48 animate-pulse rounded bg-card-border mb-3" />
            <div className="flex gap-2">
              <div className="h-8 w-32 animate-pulse rounded-lg bg-card-border" />
              <div className="h-8 w-32 animate-pulse rounded-lg bg-card-border" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="ml-2 text-sm text-muted">Loading wallet data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="rounded-2xl border border-danger/30 bg-danger-dim p-8 text-center">
          <Shield className="mx-auto mb-4 h-10 w-10 text-danger" />
          <h2 className="text-xl font-semibold text-danger">
            Wallet Not Found
          </h2>
          <p className="mt-2 text-sm text-muted">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              invalidateCache(walletId);
              fetchData();
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Header Card */}
      <div className="mb-6 rounded-2xl border border-card-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-accent" />
              <h1 className="text-2xl font-bold">
                {walletId.split(".")[0]}
              </h1>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <code className="text-sm text-muted">{walletId}</code>
              <button
                onClick={copyAddress}
                className="rounded p-1 text-muted transition-colors hover:text-foreground"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-accent" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <a
                href={`${config.explorerUrl}/address/${walletId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded p-1 text-muted transition-colors hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {balance && (
            <div className="text-right">
              <p className="text-sm text-muted">Balance</p>
              <p className="text-2xl font-bold font-mono text-accent">
                {formatNear(balance)} <span className="text-sm">NEAR</span>
              </p>
            </div>
          )}
        </div>

        {/* Members */}
        {info && (
          <div className="mt-6 border-t border-card-border pt-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
              <Users className="h-4 w-4" />
              Members ({info.members.length}) &mdash; {info.num_confirmations}{" "}
              of {info.members.length} required
            </div>
            <div className="flex flex-wrap gap-2">
              {info.members.map((m) => (
                <span
                  key={m}
                  className={`rounded-lg px-3 py-1.5 font-mono text-xs ${
                    m === accountId
                      ? "bg-accent-dim text-accent border border-accent/30"
                      : "bg-background border border-card-border text-muted"
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Pending Requests ({requests.length})
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              invalidateCache(walletId);
              fetchData();
            }}
            className="rounded-lg border border-card-border p-2.5 text-muted transition-colors hover:bg-card hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          {isSignedIn && info?.members.includes(accountId!) && (
            <button
              onClick={() => setShowNewRequest(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          )}
        </div>
      </div>

      {/* Requests */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-card-border py-16">
          <Shield className="mb-3 h-10 w-10 text-muted" />
          <p className="text-muted">No pending requests</p>
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

      {/* Transaction History */}
      <div className="mt-10">
        <TransactionHistory walletId={walletId} />
      </div>

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
  );
}
