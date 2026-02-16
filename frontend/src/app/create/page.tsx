"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNear } from "@/context/NearContext";
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

  const fullAccountId = walletName
    ? getWalletAccountId(walletName)
    : "";

  const validMembers = members.filter(
    (m) => m.address.trim().length > 0
  );

  // Auto-add the connected wallet as the first member
  useEffect(() => {
    if (accountId) {
      setMembers((prev) => {
        const alreadyAdded = prev.some(
          (m) => m.address === accountId
        );
        if (alreadyAdded) return prev;
        return [
          {
            address: accountId,
            isConnectedWallet: true,
            status: "valid" as const,
          },
          ...prev.filter((m) => !m.isConnectedWallet),
        ];
      });
    }
  }, [accountId]);

  // Validate a member address
  const validateMember = useCallback(
    async (address: string, index: number) => {
      if (!address.trim() || address.length < 2) return;

      setMembers((prev) =>
        prev.map((m, i) =>
          i === index ? { ...m, status: "checking" as const } : m
        )
      );

      const exists = await accountExists(address);

      setMembers((prev) =>
        prev.map((m, i) =>
          i === index
            ? { ...m, status: exists ? ("valid" as const) : ("invalid" as const) }
            : m
        )
      );
    },
    []
  );

  const addMemberByAddress = (address: string) => {
    const trimmed = address.trim().toLowerCase();
    if (!trimmed) return;

    const duplicate = members.some((m) => m.address === trimmed);
    if (duplicate) {
      setError("This address is already a member");
      return;
    }

    setError(null);
    const newEntry: MemberEntry = {
      address: trimmed,
      isConnectedWallet: false,
      status: "idle",
    };
    const newIndex = members.length;
    setMembers((prev) => [...prev, newEntry]);
    setManualInput("");

    // Validate async
    validateMember(trimmed, newIndex);
  };

  const removeMember = (idx: number) => {
    if (members[idx].isConnectedWallet) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const addConnectedWallet = () => {
    if (!accountId) {
      signIn();
      return;
    }
    const duplicate = members.some((m) => m.address === accountId);
    if (duplicate) {
      setError("Your connected wallet is already a member");
      return;
    }
    setError(null);
    setMembers((prev) => [
      ...prev,
      { address: accountId, isConnectedWallet: true, status: "valid" },
    ]);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setManualInput(text.trim().toLowerCase());
      }
    } catch {
      // clipboard access denied
    }
  };

  const handleCreate = async () => {
    if (!selector || !accountId) return;
    setError(null);

    if (!walletName.trim()) {
      setError("Please enter a wallet ID");
      return;
    }

    if (validMembers.length === 0) {
      setError("Add at least one member");
      return;
    }

    if (numConfirmations < 1 || numConfirmations > validMembers.length) {
      setError(
        `Required confirmations must be between 1 and ${validMembers.length}`
      );
      return;
    }

    const hasInvalid = members.some(
      (m) => m.status === "invalid" && m.address.trim()
    );
    if (hasInvalid) {
      setError(
        "Some member addresses don't exist on NEAR. Remove them or check the addresses."
      );
      return;
    }

    setCreating(true);

    try {
      await createWalletViaFactory(
        selector,
        walletName,
        validMembers.map((m) => m.address),
        numConfirmations,
        nearToYocto(initialBalance)
      );

      addStoredWallet({
        accountId: fullAccountId,
        name: name || walletName,
        createdAt: Date.now(),
      });

      router.push(`/wallet/${fullAccountId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create wallet";
      setError(message);
      setCreating(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <Shield className="mb-4 h-12 w-12 text-muted" />
        <h2 className="text-xl font-semibold">Connect your wallet first</h2>
        <p className="mt-2 text-muted">
          You need to connect a NEAR wallet to create a multisig wallet.
        </p>
        <button
          onClick={signIn}
          className="mt-6 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-black"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold">Create Multisig Wallet</h1>
      <p className="mt-2 mb-8 text-muted">
        Deploy a new multi-signature wallet on NEAR. Wallets are created as{" "}
        <code className="rounded bg-card px-1.5 py-0.5 text-xs font-mono text-accent">
          name.{FACTORY_CONTRACT_ID}
        </code>
      </p>

      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Team Treasury"
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
        </div>

        {/* Wallet ID */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Wallet ID
          </label>
          <div className="flex items-center rounded-lg border border-card-border bg-card">
            <input
              type="text"
              value={walletName}
              onChange={(e) =>
                setWalletName(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
                )
              }
              placeholder="my-team-vault"
              className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <span className="border-l border-card-border px-3 py-2.5 font-mono text-xs text-muted">
              .{FACTORY_CONTRACT_ID}
            </span>
          </div>
          {fullAccountId && (
            <p className="mt-1.5 font-mono text-xs text-accent">
              {fullAccountId}
            </p>
          )}
        </div>

        {/* Initial Balance */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Initial Balance (NEAR)
          </label>
          <input
            type="number"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value)}
            min="3"
            step="0.5"
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <p className="mt-1 text-xs text-muted">
            Minimum ~3 NEAR for account creation and contract storage
          </p>
        </div>

        {/* ── Members Section ─────────────────────────────────────────── */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Wallet Members (Signers)
          </label>
          <p className="mb-3 text-xs text-muted">
            Add NEAR accounts that can propose and approve transactions. Enter
            any valid account ID — it will be verified on-chain.
          </p>

          {/* Add member input — placed first for prominence */}
          <div className="mb-3 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value.toLowerCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMemberByAddress(manualInput);
                    }
                  }}
                  placeholder="Enter NEAR account ID (e.g. alice.testnet)"
                  className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-accent"
                />
                <button
                  onClick={pasteFromClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted transition-colors hover:text-foreground"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => addMemberByAddress(manualInput)}
                disabled={!manualInput.trim()}
                className="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Add
              </button>
            </div>

            {/* Quick add button for connected wallet */}
            {accountId &&
              !members.some((m) => m.address === accountId) && (
                <button
                  onClick={addConnectedWallet}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-accent/40 px-3 py-1.5 text-xs text-accent transition-colors hover:bg-accent-dim"
                >
                  <Wallet className="h-3.5 w-3.5" />
                  Add My Wallet ({accountId})
                </button>
              )}
          </div>

          {/* Member list */}
          {members.length > 0 && (
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div
                  key={`${member.address}-${idx}`}
                  className={`flex items-center gap-2 rounded-lg border p-3 ${
                    member.isConnectedWallet
                      ? "border-accent/30 bg-accent-dim"
                      : member.status === "invalid"
                      ? "border-danger/30 bg-danger-dim"
                      : "border-card-border bg-card"
                  }`}
                >
                  {/* Status icon */}
                  <div className="shrink-0">
                    {member.status === "checking" ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted" />
                    ) : member.status === "valid" ? (
                      <CheckCircle2 className="h-4 w-4 text-accent" />
                    ) : member.status === "invalid" ? (
                      <XCircle className="h-4 w-4 text-danger" />
                    ) : (
                      <User className="h-4 w-4 text-muted" />
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-mono text-sm">
                      {member.address}
                    </p>
                    {member.status === "invalid" && (
                      <p className="text-xs text-danger mt-0.5">
                        Account not found on NEAR
                      </p>
                    )}
                  </div>

                  {/* Badges & actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {member.isConnectedWallet && (
                      <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                        You
                      </span>
                    )}
                    {!member.isConnectedWallet && (
                      <button
                        onClick={() => removeMember(idx)}
                        className="rounded-lg p-1.5 text-muted transition-colors hover:bg-danger-dim hover:text-danger"
                        title="Remove member"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {members.length === 0 && (
            <div className="rounded-lg border border-dashed border-card-border p-6 text-center text-sm text-muted">
              No members added yet. Type a NEAR account ID above to get started.
            </div>
          )}
        </div>

        {/* Confirmations */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Required Confirmations
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={numConfirmations}
              onChange={(e) =>
                setNumConfirmations(
                  Math.max(1, parseInt(e.target.value) || 1)
                )
              }
              min={1}
              max={validMembers.length || 1}
              className="w-24 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <span className="text-sm text-muted">
              of {validMembers.length} member
              {validMembers.length !== 1 ? "s" : ""} must approve each
              transaction
            </span>
          </div>
          {validMembers.length > 1 && (
            <div className="mt-2 flex gap-1">
              {Array.from(
                { length: validMembers.length },
                (_, i) => i + 1
              ).map((n) => (
                <button
                  key={n}
                  onClick={() => setNumConfirmations(n)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    numConfirmations === n
                      ? "bg-accent text-black"
                      : "bg-card border border-card-border text-muted hover:text-foreground"
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
          <div className="flex items-start gap-2 rounded-lg bg-danger-dim p-4 text-sm text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={
            creating || !walletName.trim() || validMembers.length === 0
          }
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
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
  );
}
