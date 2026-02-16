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

  const [transferAmount, setTransferAmount] = useState("");
  const [methodName, setMethodName] = useState("");
  const [fnArgs, setFnArgs] = useState("{}");
  const [fnDeposit, setFnDeposit] = useState("0");
  const [fnGas, setFnGas] = useState("30");
  const [memberAccount, setMemberAccount] = useState("");
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

  const inputClass =
    "w-full rounded-xl border border-[#dcdee0] bg-white px-4 py-2.5 text-sm text-[#121312] placeholder:text-[#636669]/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-[#e2e2e2] bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#121312]">New Transaction</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#636669] transition-colors hover:bg-[#f4f4f4] hover:text-[#121312]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Action Type */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Action Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {actionOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setActionType(opt.value)}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${actionType === opt.value
                      ? "border-[#12ff8060] bg-[#12ff8018] text-[#121312]"
                      : "border-[#e2e2e2] text-[#636669] hover:border-[#12ff8040] hover:text-[#121312]"
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
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this request for?"
              className={inputClass}
            />
          </div>

          {/* Receiver */}
          {!isManagementAction && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
                Receiver Account
              </label>
              <input
                type="text"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
                placeholder="recipient.testnet"
                className={inputClass}
              />
            </div>
          )}

          {/* Transfer fields */}
          {actionType === "Transfer" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
                Amount (NEAR)
              </label>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="0.0"
                step="0.01"
                className={inputClass}
              />
            </div>
          )}

          {/* FunctionCall fields */}
          {actionType === "FunctionCall" && (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#121312]">Method Name</label>
                <input type="text" value={methodName} onChange={(e) => setMethodName(e.target.value)} placeholder="method_name" className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#121312]">Arguments (JSON)</label>
                <textarea value={fnArgs} onChange={(e) => setFnArgs(e.target.value)} rows={3} className={`${inputClass} font-mono`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#121312]">Deposit (NEAR)</label>
                  <input type="number" value={fnDeposit} onChange={(e) => setFnDeposit(e.target.value)} step="0.01" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#121312]">Gas (TGas)</label>
                  <input type="number" value={fnGas} onChange={(e) => setFnGas(e.target.value)} className={inputClass} />
                </div>
              </div>
            </>
          )}

          {/* Member fields */}
          {(actionType === "AddMember" || actionType === "RemoveMember") && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#121312]">Member Account</label>
              <input type="text" value={memberAccount} onChange={(e) => setMemberAccount(e.target.value)} placeholder="member.testnet" className={inputClass} />
            </div>
          )}

          {/* Threshold field */}
          {actionType === "ChangeNumConfirmations" && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#121312]">New Required Confirmations</label>
              <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(Math.max(1, parseInt(e.target.value) || 1))} min={1} className={inputClass} />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#12ff80] py-3 font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040] disabled:opacity-50"
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
