"use client";

import { useEffect, useState } from "react";
import { getTransactionHistory, type TxHistoryItem } from "@/lib/history";
import { formatNear } from "@/lib/multisig";
import {
  ArrowRightLeft,
  Code,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

function truncate(s: string | undefined | null, len = 16): string {
  if (!s) return "—";
  if (s.length <= len) return s;
  return s.slice(0, 8) + "..." + s.slice(-6);
}

function methodLabel(method: string | null): string {
  if (!method) return "Transfer";
  const map: Record<string, string> = {
    add_request: "New Request",
    confirm: "Confirm",
    revoke_confirmation: "Revoke",
    delete_request: "Delete Request",
    new: "Initialize",
  };
  return map[method] ?? method;
}

export function TransactionHistory({ walletId }: { walletId: string }) {
  const [txns, setTxns] = useState<TxHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    getTransactionHistory(walletId, 25).then((data) => {
      setTxns(data);
      setLoading(false);
    });
  }, [walletId]);

  const visible = expanded ? txns : txns.slice(0, 5);

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold">Transaction History</h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-card-border bg-card"
            />
          ))}
        </div>
      ) : txns.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-card-border py-10">
          <Clock className="mb-2 h-8 w-8 text-muted" />
          <p className="text-muted text-sm">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((tx, idx) => (
              <div
                key={`${tx.hash}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-card-border bg-card px-4 py-3"
              >
                {/* Icon */}
                <div className="shrink-0">
                  {tx.methodName ? (
                    <Code className="h-4 w-4 text-blue-400" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 text-accent" />
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {methodLabel(tx.methodName)}
                    </span>
                    {tx.status ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-danger" />
                    )}
                  </div>
                  <p className="text-xs text-muted truncate">
                    <span className="font-mono">{truncate(tx.signer)}</span>
                    {" → "}
                    <span className="font-mono">{truncate(tx.receiver)}</span>
                  </p>
                </div>

                {/* Deposit amount */}
                {tx.deposit && tx.deposit !== "0" && (
                  <div className="shrink-0 text-right">
                    <span className="font-mono text-sm text-accent">
                      {formatNear(String(tx.deposit))}
                    </span>
                    <span className="text-xs text-muted ml-1">NEAR</span>
                  </div>
                )}

                {/* Time + link */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-muted whitespace-nowrap">
                    {timeAgo(tx.blockTimestamp)}
                  </span>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {txns.length > 5 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-card-border py-2 text-sm text-muted transition-colors hover:text-foreground hover:bg-card"
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show all {txns.length} transactions
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
