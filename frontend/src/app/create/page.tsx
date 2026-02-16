"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNear } from "@/context/NearContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import {
  createWalletViaFactory,
  getWalletAccountId,
  nearToYocto,
  accountExists,
} from "@/lib/multisig";
import { addStoredWallet } from "@/lib/storage";
import { FACTORY_CONTRACT_ID } from "@/config/near";
import {
  Shield,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
  Wallet,
  CheckCircle2,
  XCircle,
  User,
  ClipboardPaste,
} from "lucide-react";
import Link from "next/link";

interface MemberEntry {
  address: string;
  isConnectedWallet: boolean;
  status: "idle" | "checking" | "valid" | "invalid";
}

export default function CreateWalletPage() {
  const { selector, accountId, isSignedIn, signIn } = useNear();
  const router = useRouter();

  const [name, setName] = useState("");
  const [walletName, setWalletName] = useState("");
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [numConfirmations, setNumConfirmations] = useState(1);
  const [initialBalance, setInitialBalance] = useState("5");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");

  const fullAccountId = walletName ? getWalletAccountId(walletName) : "";
  const validMembers = members.filter((m) => m.address.trim().length > 0);

  useEffect(() => {
    if (accountId) {
      setMembers((prev) => {
        const alreadyAdded = prev.some((m) => m.address === accountId);
        if (alreadyAdded) return prev;
        return [
          { address: accountId, isConnectedWallet: true, status: "valid" as const },
          ...prev.filter((m) => !m.isConnectedWallet),
        ];
      });
    }
  }, [accountId]);

  const validateMember = useCallback(
    async (address: string, index: number) => {
      if (!address.trim() || address.length < 2) return;
      setMembers((prev) =>
        prev.map((m, i) => (i === index ? { ...m, status: "checking" as const } : m))
      );
      const exists = await accountExists(address);
      setMembers((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, status: exists ? ("valid" as const) : ("invalid" as const) } : m
        )
      );
    },
    []
  );

  const addMemberByAddress = (address: string) => {
    const trimmed = address.trim().toLowerCase();
    if (!trimmed) return;
    const duplicate = members.some((m) => m.address === trimmed);
    if (duplicate) { setError("This address is already a member"); return; }
    setError(null);
    const newEntry: MemberEntry = { address: trimmed, isConnectedWallet: false, status: "idle" };
    const newIndex = members.length;
    setMembers((prev) => [...prev, newEntry]);
    setManualInput("");
    validateMember(trimmed, newIndex);
  };

  const removeMember = (idx: number) => {
    if (members[idx].isConnectedWallet) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const addConnectedWallet = () => {
    if (!accountId) { signIn(); return; }
    const duplicate = members.some((m) => m.address === accountId);
    if (duplicate) { setError("Your connected wallet is already a member"); return; }
    setError(null);
    setMembers((prev) => [...prev, { address: accountId, isConnectedWallet: true, status: "valid" }]);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) setManualInput(text.trim().toLowerCase());
    } catch { /* clipboard access denied */ }
  };

  const handleCreate = async () => {
    if (!selector || !accountId) return;
    setError(null);
    if (!walletName.trim()) { setError("Please enter a wallet ID"); return; }
    if (validMembers.length === 0) { setError("Add at least one member"); return; }
    if (numConfirmations < 1 || numConfirmations > validMembers.length) {
      setError(`Required confirmations must be between 1 and ${validMembers.length}`);
      return;
    }
    const hasInvalid = members.some((m) => m.status === "invalid" && m.address.trim());
    if (hasInvalid) {
      setError("Some member addresses don't exist on NEAR. Remove them or check the addresses.");
      return;
    }
    setCreating(true);
    try {
      await createWalletViaFactory(
        selector, walletName, validMembers.map((m) => m.address), numConfirmations, nearToYocto(initialBalance)
      );
      addStoredWallet({ accountId: fullAccountId, name: name || walletName, createdAt: Date.now() });
      router.push(`/wallet/${fullAccountId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create wallet";
      setError(message);
      setCreating(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-[#dcdee0] bg-white px-4 py-2.5 text-sm text-[#121312] placeholder:text-[#636669]/60 focus:border-[#12ff80] focus:ring-0";

  if (!isSignedIn) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
          <Shield className="mb-4 h-12 w-12 text-[#636669]" />
          <h2 className="text-xl font-semibold text-[#121312]">Connect your wallet first</h2>
          <p className="mt-2 text-sm text-[#636669]">
            You need to connect a NEAR wallet to create a multisig wallet.
          </p>
          <button
            onClick={signIn}
            className="mt-6 rounded-full bg-[#12ff80] px-5 py-2.5 text-sm font-semibold text-[#121312] shadow-lg shadow-[#12ff8030]"
          >
            Connect Wallet
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[#636669] transition-colors hover:text-[#121312]"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-[#121312]">Create Multisig Wallet</h1>
        <p className="mt-2 mb-8 text-sm text-[#636669]">
          Deploy a new multi-signature wallet on NEAR. Wallets are created as{" "}
          <code className="rounded-md bg-[#12ff8018] px-1.5 py-0.5 text-xs font-mono text-[#121312] border border-[#12ff8040]">
            name.{FACTORY_CONTRACT_ID}
          </code>
        </p>

        <div className="space-y-5">
          {/* Display Name */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060]">
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Team Treasury"
              className={inputClass}
            />
          </div>

          {/* Wallet ID */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060]">
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Wallet ID
            </label>
            <div className="flex items-center rounded-xl border border-[#dcdee0] bg-white overflow-hidden">
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                placeholder="my-team-vault"
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#121312] outline-none border-none shadow-none"
              />
              <span className="border-l border-[#dcdee0] px-3 py-2.5 font-mono text-xs text-[#636669] bg-[#f4f4f4]">
                .{FACTORY_CONTRACT_ID}
              </span>
            </div>
            {fullAccountId && (
              <p className="mt-1.5 font-mono text-xs text-[#0ee872]">{fullAccountId}</p>
            )}
          </div>

          {/* Initial Balance */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060]">
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Initial Balance (NEAR)
            </label>
            <input
              type="number"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              min="3"
              step="0.5"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[#636669]">
              Minimum ~3 NEAR for account creation and contract storage
            </p>
          </div>

          {/* Members Section */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060]">
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Wallet Members (Signers)
            </label>
            <p className="mb-3 text-xs text-[#636669]">
              Add NEAR accounts that can propose and approve transactions.
            </p>

            {/* Add member input */}
            <div className="mb-3 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value.toLowerCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addMemberByAddress(manualInput); }
                    }}
                    placeholder="Enter NEAR account ID (e.g. alice.testnet)"
                    className={`${inputClass} pr-10`}
                  />
                  <button
                    onClick={pasteFromClipboard}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#636669] transition-colors hover:text-[#121312]"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => addMemberByAddress(manualInput)}
                  disabled={!manualInput.trim()}
                  className="rounded-xl bg-[#12ff80] px-4 py-2.5 text-sm font-semibold text-[#121312] transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  Add
                </button>
              </div>

              {accountId && !members.some((m) => m.address === accountId) && (
                <button
                  onClick={addConnectedWallet}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[#12ff8060] px-3 py-1.5 text-xs text-[#121312] transition-colors hover:bg-[#12ff8018]"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Add My Wallet ({accountId})
                </button>
              )}
            </div>

            {/* Member list */}
            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member, idx) => (
                  <div
                    key={`${member.address}-${idx}`}
                    className={`flex items-center gap-2 rounded-xl border p-3 ${member.isConnectedWallet
                        ? "border-[#12ff8040] bg-[#12ff8018]"
                        : member.status === "invalid"
                          ? "border-red-200 bg-red-50"
                          : "border-[#e2e2e2] bg-[#f4f4f4]"
                      }`}
                  >
                    <div className="shrink-0">
                      {member.status === "checking" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[#636669]" />
                      ) : member.status === "valid" ? (
                        <CheckCircle2 className="h-4 w-4 text-[#12ff80]" />
                      ) : member.status === "invalid" ? (
                        <XCircle className="h-4 w-4 text-red-400" />
                      ) : (
                        <User className="h-4 w-4 text-[#636669]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-mono text-sm text-[#121312]">{member.address}</p>
                      {member.status === "invalid" && (
                        <p className="text-xs text-red-500 mt-0.5">Account not found on NEAR</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {member.isConnectedWallet && (
                        <span className="rounded-md bg-[#12ff8030] px-2 py-0.5 text-xs font-medium text-[#121312]">
                          You
                        </span>
                      )}
                      {!member.isConnectedWallet && (
                        <button
                          onClick={() => removeMember(idx)}
                          className="rounded-lg p-1.5 text-[#636669] transition-colors hover:bg-red-50 hover:text-red-500"
                          title="Remove member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#e2e2e2] p-6 text-center text-sm text-[#636669]">
                No members added yet. Type a NEAR account ID above to get started.
              </div>
            )}
          </div>

          {/* Confirmations */}
          <div className="rounded-2xl border border-[#e2e2e2] bg-white p-5 transition-all hover:border-[#12ff8060]">
            <label className="mb-1.5 block text-sm font-semibold text-[#121312]">
              Required Confirmations
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={numConfirmations}
                onChange={(e) => setNumConfirmations(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={validMembers.length || 1}
                className="w-24 rounded-xl border border-[#dcdee0] bg-white px-4 py-2.5 text-sm text-[#121312]"
              />
              <span className="text-sm text-[#636669]">
                of {validMembers.length} member{validMembers.length !== 1 ? "s" : ""} must approve
              </span>
            </div>
            {validMembers.length > 1 && (
              <div className="mt-3 flex gap-1.5">
                {Array.from({ length: validMembers.length }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setNumConfirmations(n)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${numConfirmations === n
                        ? "bg-[#12ff80] text-[#121312]"
                        : "bg-[#f4f4f4] border border-[#e2e2e2] text-[#636669] hover:text-[#121312]"
                      }`}
                  >
                    {n}/{validMembers.length}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={creating || !walletName.trim() || validMembers.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#12ff80] py-3.5 font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040] disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Wallet...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Create Multisig Wallet
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
