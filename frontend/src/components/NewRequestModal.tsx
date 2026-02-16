"use client";

import { useState } from "react";
import { useNear } from "@/context/NearContext";
import { addRequest, nearToYocto } from "@/lib/multisig";
import type { MultiSigAction } from "@/types";
import {
  X,
  ArrowRightLeft,
  Code,
  UserPlus,
  UserMinus,
  Settings,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface NewRequestModalProps {
  walletId: string;
  onClose: () => void;
  onSuccess: () => void;
}

type ActionType =
  | "Transfer"
  | "FunctionCall"
  | "AddMember"
  | "RemoveMember"
  | "ChangeNumConfirmations";

const actionOptions: { value: ActionType; label: string; icon: typeof ArrowRightLeft }[] = [
  { value: "Transfer", label: "Transfer NEAR", icon: ArrowRightLeft },
  { value: "FunctionCall", label: "Function Call", icon: Code },
  { value: "AddMember", label: "Add Member", icon: UserPlus },
  { value: "RemoveMember", label: "Remove Member", icon: UserMinus },
  { value: "ChangeNumConfirmations", label: "Change Threshold", icon: Settings },
];

export function NewRequestModal({
  walletId,
  onClose,
  onSuccess,
}: NewRequestModalProps) {
  const { selector } = useNear();
  const [actionType, setActionType] = useState<ActionType>("Transfer");
  const [receiverId, setReceiverId] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transfer fields
  const [transferAmount, setTransferAmount] = useState("");

  // FunctionCall fields
  const [methodName, setMethodName] = useState("");
  const [fnArgs, setFnArgs] = useState("{}");
  const [fnDeposit, setFnDeposit] = useState("0");
  const [fnGas, setFnGas] = useState("30");

  // Member fields
  const [memberAccount, setMemberAccount] = useState("");

  // Threshold field
  const [newThreshold, setNewThreshold] = useState(2);

  const buildAction = (): MultiSigAction => {
    switch (actionType) {
      case "Transfer":
        return { type: "Transfer", amount: nearToYocto(transferAmount) };
      case "FunctionCall":
        return {
          type: "FunctionCall",
          method_name: methodName,
          args: fnArgs,
          deposit: nearToYocto(fnDeposit),
          gas: (BigInt(fnGas) * BigInt("1000000000000")).toString(),
        };
      case "AddMember":
        return { type: "AddMember", member: memberAccount };
      case "RemoveMember":
        return { type: "RemoveMember", member: memberAccount };
      case "ChangeNumConfirmations":
        return { type: "ChangeNumConfirmations", num_confirmations: newThreshold };
    }
  };

  const handleSubmit = async () => {
    if (!selector) return;
    setError(null);

    const effectiveReceiver =
      actionType === "AddMember" ||
      actionType === "RemoveMember" ||
      actionType === "ChangeNumConfirmations"
        ? walletId
        : receiverId;

    if (!effectiveReceiver) {
      setError("Receiver account ID is required");
      return;
    }

    setSubmitting(true);

    try {
      await addRequest(selector, walletId, {
        receiver_id: effectiveReceiver,
        actions: [buildAction()],
        description,
      });
      onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit request";
      setError(message);
      setSubmitting(false);
    }
  };

  const isManagementAction =
    actionType === "AddMember" ||
    actionType === "RemoveMember" ||
    actionType === "ChangeNumConfirmations";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-card-border bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">New Request</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Action Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Action Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {actionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActionType(opt.value)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                    actionType === opt.value
                      ? "border-accent bg-accent-dim text-accent"
                      : "border-card-border text-muted hover:border-foreground/20"
                  }`}
                >
                  <opt.icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this request for?"
              className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
          </div>

          {/* Receiver (only for Transfer / FunctionCall) */}
          {!isManagementAction && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Receiver Account
              </label>
              <input
                type="text"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="recipient.testnet"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          {/* Action-specific fields */}
          {actionType === "Transfer" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Amount (NEAR)
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          {actionType === "FunctionCall" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Method Name
                </label>
                <input
                  type="text"
                  value={methodName}
                  onChange={(e) => setMethodName(e.target.value)}
                  placeholder="method_name"
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-mono outline-none transition-colors focus:border-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Arguments (JSON)
                </label>
                <textarea
                  value={fnArgs}
                  onChange={(e) => setFnArgs(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm font-mono outline-none transition-colors focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Deposit (NEAR)
                  </label>
                  <input
                    type="number"
                    value={fnDeposit}
                    onChange={(e) => setFnDeposit(e.target.value)}
                    step="0.01"
                    className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium">
                    Gas (TGas)
                  </label>
                  <input
                    type="number"
                    value={fnGas}
                    onChange={(e) => setFnGas(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
                  />
                </div>
              </div>
            </>
          )}

          {(actionType === "AddMember" || actionType === "RemoveMember") && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Member Account
              </label>
              <input
                type="text"
                value={memberAccount}
                onChange={(e) => setMemberAccount(e.target.value)}
                placeholder="member.testnet"
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          {actionType === "ChangeNumConfirmations" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                New Required Confirmations
              </label>
              <input
                type="number"
                value={newThreshold}
                onChange={(e) =>
                  setNewThreshold(Math.max(1, parseInt(e.target.value) || 1))
                }
                min={1}
                className="w-full rounded-lg border border-card-border bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-dim p-3 text-sm text-danger">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
