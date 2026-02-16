"use client";

import type { MultiSigRequestView } from "@/types";
import { formatNear } from "@/lib/multisig";
import {
  ArrowRightLeft,
  Check,
  X,
  Trash2,
  UserPlus,
  UserMinus,
  Settings,
  Code,
} from "lucide-react";

interface RequestCardProps {
  request: MultiSigRequestView;
  currentAccount: string | null;
  isMember?: boolean;
  onConfirm: () => void;
  onRevoke: () => void;
  onDelete: () => void;
}

function ActionBadge({ action }: { action: MultiSigRequestView["actions"][0] }) {
  switch (action.type) {
    case "Transfer":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-accent-dim px-3 py-1.5 text-sm">
          <ArrowRightLeft className="h-3.5 w-3.5 text-accent" />
          <span className="text-accent font-mono">
            {formatNear(action.amount)} NEAR
          </span>
        </div>
      );
    case "FunctionCall":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-blue-500/10 px-3 py-1.5 text-sm">
          <Code className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-blue-400 font-mono">{action.method_name}()</span>
        </div>
      );
    case "AddMember":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1.5 text-sm">
          <UserPlus className="h-3.5 w-3.5 text-green-400" />
          <span className="text-green-400">Add: {action.member}</span>
        </div>
      );
    case "RemoveMember":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm">
          <UserMinus className="h-3.5 w-3.5 text-red-400" />
          <span className="text-red-400">Remove: {action.member}</span>
        </div>
      );
    case "ChangeNumConfirmations":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm">
          <Settings className="h-3.5 w-3.5 text-yellow-400" />
          <span className="text-yellow-400">
            Threshold → {action.num_confirmations}
          </span>
        </div>
      );
  }
}

export function RequestCard({
  request,
  currentAccount,
  isMember = true,
  onConfirm,
  onRevoke,
  onDelete,
}: RequestCardProps) {
  const hasConfirmed = currentAccount
    ? request.confirmations.includes(currentAccount)
    : false;
  const isRequester = currentAccount === request.requester;
  const progress = request.confirmations.length / request.required;

  return (
    <div className="rounded-2xl border border-card-border bg-card p-5">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-card-border px-2 py-0.5 font-mono text-xs text-muted">
              #{request.id}
            </span>
            <span className="text-sm font-medium">
              {request.description || "No description"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            by{" "}
            <span className="font-mono">
              {request.requester}
            </span>{" "}
            → <span className="font-mono">{request.receiver_id}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-sm">
          <span
            className={`font-mono font-bold ${
              progress >= 1 ? "text-accent" : "text-muted"
            }`}
          >
            {request.confirmations.length}/{request.required}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        {request.actions.map((action, idx) => (
          <ActionBadge key={idx} action={action} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-card-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Confirmers */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {request.confirmations.map((c) => (
          <span
            key={c}
            className="rounded-md bg-accent-dim px-2 py-0.5 font-mono text-xs text-accent"
          >
            {c}
          </span>
        ))}
      </div>

      {/* Buttons */}
      {currentAccount && (
        <div className="flex gap-2">
          {!hasConfirmed ? (
            <button
              onClick={onConfirm}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-opacity hover:opacity-90"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </button>
          ) : (
            <button
              onClick={onRevoke}
              className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger"
            >
              <X className="h-3.5 w-3.5" />
              Revoke
            </button>
          )}

          {isRequester && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-danger hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
