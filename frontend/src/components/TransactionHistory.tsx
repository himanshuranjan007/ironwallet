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
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl border border-[#e2e2e2] bg-white"
            />
          ))}
        </div>
      ) : txns.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-[#e2e2e2] bg-white py-10">
          <Clock className="mb-2 h-8 w-8 text-[#636669]" />
          <p className="text-[#636669] text-sm font-medium">No transactions yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {visible.map((tx, idx) => (
              <div
                key={`${tx.hash}-${idx}`}
                className="flex items-center gap-3 rounded-xl border border-[#e2e2e2] bg-white px-4 py-3 transition-all hover:border-[#12ff8060] hover:shadow-sm"
              >
                {/* Icon */}
                <div className="shrink-0">
                  {tx.methodName ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <Code className="h-4 w-4 text-blue-600" />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#12ff8018]">
                      <ArrowRightLeft className="h-4 w-4 text-[#121312]" />
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#121312]">
                      {methodLabel(tx.methodName)}
                    </span>
                    {tx.status ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-xs text-[#636669] truncate">
                    <span className="font-mono">{truncate(tx.signer)}</span>
                    {" → "}
                    <span className="font-mono">{truncate(tx.receiver)}</span>
                  </p>
                </div>

                {/* Deposit */}
                {tx.deposit && tx.deposit !== "0" && (
                  <div className="shrink-0 text-right">
                    <span className="font-mono text-sm font-semibold text-[#121312]">
                      {formatNear(String(tx.deposit))}
                    </span>
                    <span className="text-xs text-[#636669] ml-1">NEAR</span>
                  </div>
                )}

                {/* Time + link */}
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-[#636669] whitespace-nowrap">
                    {timeAgo(tx.blockTimestamp)}
                  </span>
                  <a
                    href={tx.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#636669] hover:text-[#121312] transition-colors"
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
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#e2e2e2] bg-white py-2.5 text-sm text-[#636669] transition-all hover:border-[#12ff8060] hover:text-[#121312]"
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
