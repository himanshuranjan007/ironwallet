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
        <div className="flex items-center gap-2 rounded-lg bg-[#12ff8018] border border-[#12ff8030] px-3 py-1.5 text-sm">
          <ArrowRightLeft className="h-3.5 w-3.5 text-[#121312]" />
          <span className="font-mono font-medium text-[#121312]">
            {formatNear(action.amount)} NEAR
          </span>
        </div>
      );
    case "FunctionCall":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 px-3 py-1.5 text-sm">
          <Code className="h-3.5 w-3.5 text-blue-600" />
          <span className="font-mono text-blue-700">{action.method_name}()</span>
        </div>
      );
    case "AddMember":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-1.5 text-sm">
          <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-700">Add: {action.member}</span>
        </div>
      );
    case "RemoveMember":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-1.5 text-sm">
          <UserMinus className="h-3.5 w-3.5 text-red-600" />
          <span className="text-red-700">Remove: {action.member}</span>
        </div>
      );
    case "ChangeNumConfirmations":
      return (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-1.5 text-sm">
          <Settings className="h-3.5 w-3.5 text-amber-600" />
          <span className="text-amber-700">
            Threshold → {action.num_confirmations}
          </span>
        </div>
      );
  }
}

export function RequestCard({
  request,
  currentAccount,
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
    <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060] hover:shadow-lg hover:shadow-[#12ff8010]">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#f4f4f4] px-2 py-0.5 font-mono text-xs text-[#636669] border border-[#e2e2e2]">
              #{request.id}
            </span>
            <span className="text-sm font-semibold text-[#121312]">
              {request.description || "No description"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#636669]">
            by{" "}
            <span className="font-mono">{request.requester}</span>{" "}
            → <span className="font-mono">{request.receiver_id}</span>
          </p>
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${progress >= 1 ? "text-emerald-600" : "text-amber-600"
          }`}>
          {request.confirmations.length}/{request.required}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-4 flex flex-wrap gap-2">
        {request.actions.map((action, idx) => (
          <ActionBadge key={idx} action={action} />
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[#f4f4f4]">
        <div
          className="h-full rounded-full bg-[#12ff80] transition-all"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>

      {/* Confirmers */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {request.confirmations.map((c) => (
          <span
            key={c}
            className="rounded-md bg-[#12ff8018] border border-[#12ff8030] px-2 py-0.5 font-mono text-xs text-[#121312]"
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
              className="inline-flex items-center gap-1.5 rounded-full bg-[#12ff80] px-4 py-2 text-sm font-semibold text-[#121312] transition-all hover:bg-[#0ee872] hover:shadow-lg hover:shadow-[#12ff8030]"
            >
              <Check className="h-3.5 w-3.5" />
              Confirm
            </button>
          ) : (
            <button
              onClick={onRevoke}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e2e2] px-4 py-2 text-sm font-medium text-[#636669] transition-colors hover:border-red-200 hover:text-red-500 hover:bg-red-50"
            >
              <X className="h-3.5 w-3.5" />
              Revoke
            </button>
          )}

          {isRequester && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e2e2e2] px-4 py-2 text-sm font-medium text-[#636669] transition-colors hover:border-red-200 hover:text-red-500 hover:bg-red-50"
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
