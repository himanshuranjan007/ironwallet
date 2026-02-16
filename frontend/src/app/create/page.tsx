"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNear } from "@/context/NearContext";
import { deployMultisigWallet, nearToYocto } from "@/lib/multisig";
import { addStoredWallet } from "@/lib/storage";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

export default function CreateWalletPage() {
  const { selector, accountId, isSignedIn } = useNear();
  const router = useRouter();

  const [name, setName] = useState("");
  const [subAccount, setSubAccount] = useState("");
  const [members, setMembers] = useState<string[]>([""]);
  const [numConfirmations, setNumConfirmations] = useState(1);
  const [initialBalance, setInitialBalance] = useState("2");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fullAccountId = subAccount && accountId
    ? `${subAccount}.${accountId}`
    : "";

  const validMembers = members.filter((m) => m.trim().length > 0);

  const addMember = () => setMembers([...members, ""]);

  const removeMember = (idx: number) => {
    if (members.length <= 1) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx: number, value: string) => {
    const updated = [...members];
    updated[idx] = value;
    setMembers(updated);
  };

  const handleCreate = async () => {
    if (!selector || !accountId) return;

    setError(null);

    if (!subAccount.trim()) {
      setError("Please enter a wallet name");
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

    setCreating(true);

    try {
      const wasmResponse = await fetch("/multisig.wasm");
      const wasmBuffer = await wasmResponse.arrayBuffer();
      const wasmBytes = new Uint8Array(wasmBuffer);

      await deployMultisigWallet(
        selector,
        fullAccountId,
        validMembers,
        numConfirmations,
        wasmBytes,
        nearToYocto(initialBalance)
      );

      addStoredWallet({
        accountId: fullAccountId,
        name: name || subAccount,
        createdAt: Date.now(),
      });

      router.push(`/wallet/${fullAccountId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create wallet";
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
        Deploy a new multi-signature wallet as a sub-account of your NEAR
        account.
      </p>

      <div className="space-y-6">
        {/* Wallet Name */}
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

        {/* Sub-account */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Wallet Account ID
          </label>
          <div className="flex items-center rounded-lg border border-card-border bg-card">
            <input
              type="text"
              value={subAccount}
              onChange={(e) =>
                setSubAccount(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
              }
              placeholder="my-vault"
              className="flex-1 bg-transparent px-4 py-2.5 text-sm outline-none"
            />
            <span className="border-l border-card-border px-3 py-2.5 font-mono text-xs text-muted">
              .{accountId}
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
            min="2"
            step="0.1"
            className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
          />
          <p className="mt-1 text-xs text-muted">
            Minimum ~2 NEAR for account creation and contract storage
          </p>
        </div>

        {/* Members */}
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Wallet Members (Signers)
          </label>
          <div className="space-y-2">
            {members.map((member, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMember(idx, e.target.value)}
                  placeholder="account.testnet"
                  className="flex-1 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
                />
                {members.length > 1 && (
                  <button
                    onClick={() => removeMember(idx)}
                    className="rounded-lg border border-card-border p-2.5 text-muted transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addMember}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-card-border px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Member
          </button>
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
                setNumConfirmations(Math.max(1, parseInt(e.target.value) || 1))
              }
              min={1}
              max={validMembers.length || 1}
              className="w-24 rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent"
            />
            <span className="text-sm text-muted">
              of {validMembers.length} member{validMembers.length !== 1 ? "s" : ""}
            </span>
          </div>
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
          disabled={creating || !subAccount.trim() || validMembers.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {creating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deploying Wallet...
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
