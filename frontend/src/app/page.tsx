"use client";

import Link from "next/link";
import { useNear } from "@/context/NearContext";
import { LandingNavbar } from "@/components/LandingNavbar";
import { DashboardMockup } from "@/components/DashboardMockup";
import {
  Shield,
  Users,
  ArrowRightLeft,
  Lock,
  ChevronRight,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
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
      "Add or remove signers, change thresholds — all through the same multisig approval process. Fully decentralized control.",
  },
];

const stats = [
  { icon: Globe, value: "NEAR Protocol", label: "Built natively on NEAR" },
  { icon: Shield, value: "N-of-M", label: "Configurable threshold" },
  { icon: Zap, value: "Auto-Execute", label: "On threshold confirmation" },
];

const steps = [
  {
    number: "01",
    title: "Create a Wallet",
    description: "Deploy a new multisig wallet through the factory contract. Set your members and approval threshold.",
  },
  {
    number: "02",
    title: "Add Members",
    description: "Invite team members by their NEAR account IDs. Each member is validated on-chain before being added.",
  },
  {
    number: "03",
    title: "Propose & Confirm",
    description: "Any member proposes transactions. Once enough members approve, the transaction auto-executes on-chain.",
  },
];

export default function Home() {
  const { isSignedIn, signIn } = useNear();

  return (
    <div className="landing">
      <LandingNavbar />

      {/* ── First-page wrapper with video background ────────── */}
      <div className="relative overflow-hidden">
        {/* Full-page background video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-[0.18] pointer-events-none z-0"
        >
          <source src="/waves.mp4" type="video/mp4" />
        </video>
        {/* Gradient overlay — fades to page bg at the bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#fafafa]/40 via-transparent to-[#fafafa] pointer-events-none z-[1]" />

        {/* Announcement Banner */}
        <div className="relative z-10 border-b border-[#e8e8e8]/60 bg-[#f8fdf8]/70 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-2.5">
            <span className="rounded-md bg-[#12ff80] px-2 py-0.5 text-xs font-bold text-[#121312]">
              NEAR Native
            </span>
            <p className="text-sm text-[#636669]">
              Automatically manage shared funds with on-chain multisig security, powered by{" "}
              <a
                href="https://near.org"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#121312] underline decoration-[#12ff80] decoration-2 underline-offset-2 hover:text-[#12ff80]"
              >
                NEAR Protocol
              </a>{" "}
              →
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 px-6 pt-20 pb-16">
          {/* Decorative blobs */}
          <div className="blob blob-green animate-float-slow" style={{ width: 320, height: 320, top: -60, right: -80 }} />
          <div className="blob blob-green-light animate-float" style={{ width: 200, height: 200, top: 40, right: 120 }} />
          <div className="blob blob-green animate-float" style={{ width: 260, height: 260, top: -40, left: -100 }} />
          <div className="blob blob-green-light animate-float-slow" style={{ width: 160, height: 160, bottom: 80, left: 40 }} />

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            {/* Small badge */}
            <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 py-1.5 text-sm font-medium text-[#636669] shadow-sm">
              <Shield className="h-4 w-4 text-[#12ff80]" />
              NEAR Protocol Supported
            </div>

            {/* Main headline */}
            <h1 className="animate-fade-in-up-delay-1 text-5xl font-bold leading-[1.1] tracking-tight text-[#121312] sm:text-6xl md:text-7xl">
              Multisig security for
              <br />
              your onchain assets
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up-delay-2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#636669]">
              The most trusted smart wallet infrastructure on NEAR.
              <br />
              Modular, programmable and battle-tested.
            </p>

            {/* CTA Button */}
            <div className="animate-fade-in-up-delay-3 mt-10">
              {isSignedIn ? (
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-8 py-3.5 text-base font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040]"
                >
                  Launch App
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <button
                  onClick={signIn}
                  className="group inline-flex items-center gap-2 rounded-full bg-[#12ff80] px-8 py-3.5 text-base font-semibold text-[#121312] shadow-lg shadow-[#12ff8030] transition-all hover:bg-[#0ee872] hover:shadow-xl hover:shadow-[#12ff8040]"
                >
                  Launch App
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Dashboard Mockup */}
        <section className="relative z-10 pb-24">
          <DashboardMockup />
        </section>
      </div>

      {/* Stats Section */}
      <section id="security" className="border-y border-[#e8e8e8] bg-white py-16">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#12ff8018]">
                <s.icon className="h-6 w-6 text-[#121312]" />
              </div>
              <p className="text-xl font-bold text-[#121312]">{s.value}</p>
              <p className="mt-1 text-sm text-[#636669]">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#e2e2e2] bg-white px-4 py-1.5 text-sm font-medium text-[#636669]">
              <Zap className="h-4 w-4 text-[#12ff80]" />
              Core Features
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-[#121312] sm:text-4xl">
              Everything you need for
              <br />
              <span className="text-[#636669]">secure asset management</span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-[#e2e2e2] bg-white p-7 transition-all hover:border-[#12ff8060] hover:shadow-lg hover:shadow-[#12ff8010]"
              >
                <div className="mb-5 inline-flex rounded-xl bg-[#12ff8018] p-3">
                  <f.icon className="h-6 w-6 text-[#121312]" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#121312]">
                  {f.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#636669]">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="border-t border-[#e8e8e8] bg-white py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#121312] sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-[#636669]">
              Get started in minutes with three simple steps
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="mb-4 text-5xl font-bold text-[#12ff80]/30">
                  {step.number}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#121312]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[#636669]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            {isSignedIn ? (
              <Link
                href="/create"
                className="group inline-flex items-center gap-2 rounded-full bg-[#121312] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#2a2d2a]"
              >
                Create Your First Wallet
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <button
                onClick={signIn}
                className="group inline-flex items-center gap-2 rounded-full bg-[#121312] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#2a2d2a]"
              >
                Get Started Now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e8e8] bg-[#fafafa] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#121312]">
              <Shield className="h-3.5 w-3.5 text-[#12ff80]" />
            </div>
            <span className="text-sm font-bold text-[#121312]">
              Iron{" "}
              <span className="font-normal text-[#636669]">{"{Wallet}"}</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#636669]">
            <a href="https://docs.near.org" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#121312]">
              Docs
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#121312]">
              GitHub
            </a>
            <a href="https://near.org" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[#121312]">
              NEAR Protocol
            </a>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#636669]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#12ff80]" />
            Built on NEAR Protocol
          </div>
        </div>
      </footer>
    </div>
  );
}
