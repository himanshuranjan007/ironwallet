"use client";

import Link from "next/link";
import { useNear } from "@/context/NearContext";
import {
  Shield,
  Users,
  ArrowRightLeft,
  Lock,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Multi-Signer Security",
    description:
      "Add multiple wallet addresses as signers. Define how many approvals are needed before any transaction goes through.",
  },
  {
    icon: ArrowRightLeft,
    title: "Propose & Approve",
    description:
      "Any member can propose a transaction. Other members review and confirm. Once the threshold is met, it executes automatically.",
  },
  {
    icon: Lock,
    title: "On-Chain Governance",
    description:
      "Add or remove signers, change thresholds — all through the same multisig approval process. Fully decentralized.",
  },
];

export default function Home() {
  const { isSignedIn, signIn } = useNear();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 pt-24 pb-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-dim bg-accent-dim px-4 py-1.5 text-sm font-medium text-accent">
          <Shield className="h-4 w-4" />
          Built on NEAR Protocol
        </div>

        <h1 className="max-w-3xl text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          Secure your assets with{" "}
          <span className="text-accent">multi-signature</span> wallets
        </h1>

        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Create shared wallets on NEAR blockchain that require multiple
          approvals for every transaction. No single point of failure.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
            >
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              onClick={signIn}
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
            >
              Connect Wallet to Start
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          <a
            href="https://docs.near.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-card-border px-6 py-3 font-semibold transition-colors hover:bg-card"
          >
            Learn about NEAR
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-6 px-4 pb-24 sm:grid-cols-3">
        {features.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-card-border bg-card p-6 transition-colors hover:border-accent/30"
          >
            <div className="mb-4 inline-flex rounded-lg bg-accent-dim p-2.5">
              <f.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
            <p className="text-sm leading-relaxed text-muted">
              {f.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
