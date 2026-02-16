"use client";

import { Shield, Users, ArrowUpRight, ArrowDownLeft, Check } from "lucide-react";

const assets = [
    { name: "NEAR", symbol: "NEAR", balance: "1,250.00", value: "$8,125.00", color: "#00EC97" },
    { name: "USDC", symbol: "USDC", balance: "5,000.00", value: "$5,000.00", color: "#2775CA" },
    { name: "wETH", symbol: "wETH", balance: "2.45", value: "$6,370.00", color: "#627EEA" },
];

const members = [
    { name: "alice.near", confirmed: true },
    { name: "bob.near", confirmed: true },
    { name: "carol.near", confirmed: false },
];

const transactions = [
    { type: "send", label: "Send 100 NEAR", to: "dao.near", status: "Pending (2/3)", color: "#F59E0B" },
    { type: "receive", label: "Received 500 USDC", to: "bridge.near", status: "Confirmed", color: "#12ff80" },
];

export function DashboardMockup() {
    return (
        <div className="relative mx-auto w-full max-w-5xl px-4">
            {/* Browser chrome frame */}
            <div className="animate-fade-in-up-delay-3 rounded-2xl border border-[#e2e2e2] bg-white shadow-2xl shadow-black/8">
                {/* Browser top bar */}
                <div className="flex items-center gap-2 border-b border-[#e8e8e8] px-4 py-3">
                    <div className="flex gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                        <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                        <div className="h-3 w-3 rounded-full bg-[#28c840]" />
                    </div>
                    <div className="ml-4 flex-1 rounded-md bg-[#f4f4f4] px-3 py-1 text-xs text-[#636669]">
                        iron-wallet.near
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1.5 rounded-md bg-[#f4f4f4] px-2.5 py-1">
                            <div className="h-2 w-2 rounded-full bg-[#12ff80]" />
                            <span className="text-xs font-medium text-[#121312]">Connected</span>
                        </div>
                    </div>
                </div>

                {/* Dashboard content */}
                <div className="grid grid-cols-12 gap-0 divide-x divide-[#e8e8e8]">
                    {/* Left sidebar - wallet info */}
                    <div className="col-span-4 p-5">
                        <div className="mb-4 flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#121312]">
                                <Shield className="h-4 w-4 text-[#12ff80]" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-[#121312]">Team Vault</p>
                                <p className="text-xs text-[#636669]">team-vault.iron-wallet.near</p>
                            </div>
                        </div>

                        {/* Total balance */}
                        <div className="mb-5 rounded-xl bg-gradient-to-br from-[#121312] to-[#1a1f1a] p-4">
                            <p className="mb-1 text-xs text-[#636669]">Total Balance</p>
                            <p className="text-2xl font-bold text-white">$19,495<span className="text-lg text-[#636669]">.00</span></p>
                            <div className="mt-2 flex gap-2">
                                <span className="rounded-full bg-[#12ff8020] px-2 py-0.5 text-xs font-medium text-[#12ff80]">+4.2%</span>
                            </div>
                        </div>

                        {/* Members */}
                        <div>
                            <div className="mb-2 flex items-center gap-1.5">
                                <Users className="h-3.5 w-3.5 text-[#636669]" />
                                <p className="text-xs font-semibold text-[#636669] uppercase tracking-wider">Members (2/3 Threshold)</p>
                            </div>
                            <div className="space-y-1.5">
                                {members.map((m) => (
                                    <div key={m.name} className="flex items-center justify-between rounded-lg bg-[#f4f4f4] px-3 py-2">
                                        <span className="text-xs font-medium text-[#121312]">{m.name}</span>
                                        {m.confirmed && <Check className="h-3.5 w-3.5 text-[#12ff80]" />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right content */}
                    <div className="col-span-8 p-5">
                        {/* Assets */}
                        <div className="mb-5">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#121312]">Assets</p>
                                <span className="text-xs text-[#636669]">View all →</span>
                            </div>
                            <div className="space-y-2">
                                {assets.map((a) => (
                                    <div key={a.symbol} className="flex items-center justify-between rounded-xl border border-[#e8e8e8] px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                                                style={{ background: a.color }}
                                            >
                                                {a.symbol[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#121312]">{a.name}</p>
                                                <p className="text-xs text-[#636669]">{a.balance} {a.symbol}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-semibold text-[#121312]">{a.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pending Transactions */}
                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-semibold text-[#121312]">Pending Transactions</p>
                                <span className="rounded-full bg-[#F59E0B20] px-2 py-0.5 text-xs font-medium text-[#F59E0B]">1 pending</span>
                            </div>
                            <div className="space-y-2">
                                {transactions.map((tx, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-xl border border-[#e8e8e8] px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${tx.type === "send" ? "bg-[#F59E0B20]" : "bg-[#12ff8020]"}`}>
                                                {tx.type === "send" ? (
                                                    <ArrowUpRight className="h-4 w-4 text-[#F59E0B]" />
                                                ) : (
                                                    <ArrowDownLeft className="h-4 w-4 text-[#12ff80]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[#121312]">{tx.label}</p>
                                                <p className="text-xs text-[#636669]">→ {tx.to}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                                            style={{ color: tx.color, background: `${tx.color}18` }}
                                        >
                                            {tx.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
